from django.db.models import Count, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from apps.locations.models import State
from apps.schemes.models import FarmerType, Scheme, SchemeCategory
from apps.schemes.serializers import (
    SchemeDetailSerializer,
    SchemeFacetsResponseSerializer,
    SchemeListSerializer,
)


class SchemePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


class SchemeListView(generics.ListAPIView):
    serializer_class = SchemeListSerializer
    pagination_class = SchemePagination
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "schemes"

    @extend_schema(
        summary="List and filter government schemes",
        description="Returns a paginated list of active agricultural government schemes with multi-criteria filtering and text search.",
        parameters=[
            OpenApiParameter(
                name="q",
                description="Search query in name, description, department",
                type=str,
            ),
            OpenApiParameter(
                name="level",
                description="Filter by level: 'central' or 'state'",
                type=str,
            ),
            OpenApiParameter(
                name="category",
                description="Filter by SchemeCategory slug or ID",
                type=str,
            ),
            OpenApiParameter(
                name="farmer_type", description="Filter by FarmerType slug", type=str
            ),
            OpenApiParameter(
                name="state", description="Filter by state code or ID", type=str
            ),
            OpenApiParameter(
                name="status",
                description="Filter by status (default: 'active')",
                type=str,
            ),
        ],
        responses={200: SchemeListSerializer(many=True)},
    )
    def get_queryset(self):
        qs = Scheme.objects.select_related("category", "state").prefetch_related(
            "farmer_types"
        )

        # Status filter (default active)
        status_param = self.request.query_params.get("status", "active")
        if status_param and status_param.lower() != "all":
            qs = qs.filter(status=status_param.lower())

        # Level filter ('central' or 'state')
        level_param = self.request.query_params.get("level")
        if level_param:
            qs = qs.filter(level=level_param.lower())

        # Category filter (by slug or id)
        cat_param = self.request.query_params.get("category")
        if cat_param:
            if cat_param.isdigit():
                qs = qs.filter(category_id=int(cat_param))
            else:
                qs = qs.filter(category__slug=cat_param)

        # Farmer Type filter (by slug or name)
        ft_param = self.request.query_params.get("farmer_type")
        if ft_param:
            qs = qs.filter(farmer_types__slug=ft_param)

        # State filter (by code or id)
        state_param = self.request.query_params.get("state")
        if state_param:
            if state_param.isdigit():
                qs = qs.filter(state_id=int(state_param))
            else:
                qs = qs.filter(
                    Q(state__code__iexact=state_param)
                    | Q(state__code__iexact=f"IN-{state_param}")
                    | Q(state__name__iexact=state_param)
                )

        # Search query across title, description, and department
        q_param = self.request.query_params.get("q")
        if q_param and q_param.strip():
            query = q_param.strip()
            qs = qs.filter(
                Q(name__icontains=query)
                | Q(short_description__icontains=query)
                | Q(description__icontains=query)
                | Q(department__icontains=query)
            )

        return qs.distinct().order_by("-last_verified_on", "name")


class SchemeDetailView(generics.RetrieveAPIView):
    queryset = Scheme.objects.select_related("category", "state").prefetch_related(
        "farmer_types"
    )
    serializer_class = SchemeDetailSerializer
    lookup_field = "slug"
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "schemes"

    @extend_schema(
        summary="Retrieve detailed profile of a government scheme",
        description="Returns full scheme details including benefits, eligibility, required documents, and official application URL.",
        responses={200: SchemeDetailSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class SchemeFacetsView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "schemes"

    @extend_schema(
        summary="Retrieve scheme filter facets and counts",
        description="Returns active scheme counts grouped by category, level, farmer types, and states for UI filters.",
        responses={200: SchemeFacetsResponseSerializer},
    )
    def get(self, request):
        base_qs = Scheme.objects.filter(status="active")

        # Categories with count
        cats = (
            SchemeCategory.objects.filter(schemes__status="active")
            .annotate(scheme_count=Count("schemes", distinct=True))
            .filter(scheme_count__gt=0)
            .order_by("name")
        )
        cat_data = [
            {"id": c.slug, "name": c.name, "count": c.scheme_count} for c in cats
        ]

        # Levels with count
        central_count = base_qs.filter(level="central").count()
        state_count = base_qs.filter(level="state").count()
        level_data = [
            {"id": "central", "name": "Central Schemes", "count": central_count},
            {"id": "state", "name": "State Schemes", "count": state_count},
        ]

        # Farmer Types with count
        fts = (
            FarmerType.objects.filter(schemes__status="active")
            .annotate(scheme_count=Count("schemes", distinct=True))
            .filter(scheme_count__gt=0)
            .order_by("name")
        )
        ft_data = [{"id": f.slug, "name": f.name, "count": f.scheme_count} for f in fts]

        # States with count
        states = (
            State.objects.filter(schemes__status="active")
            .annotate(scheme_count=Count("schemes", distinct=True))
            .filter(scheme_count__gt=0)
            .order_by("name")
        )
        state_data = [
            {"id": s.code, "name": s.name, "count": s.scheme_count} for s in states
        ]

        return Response(
            {
                "categories": cat_data,
                "levels": level_data,
                "farmer_types": ft_data,
                "states": state_data,
                "total_active_schemes": base_qs.count(),
            },
            status=status.HTTP_200_OK,
        )
