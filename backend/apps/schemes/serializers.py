from rest_framework import serializers
from apps.schemes.models import FarmerType, Scheme, SchemeCategory


class SchemeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SchemeCategory
        fields = ["id", "name", "slug", "description"]


class FarmerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerType
        fields = ["id", "name", "slug"]


class SchemeListSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name")
    category_slug = serializers.CharField(source="category.slug")
    state_name = serializers.CharField(
        source="state.name", default=None, allow_null=True
    )
    farmer_types = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field="name",
    )

    class Meta:
        model = Scheme
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "level",
            "state_name",
            "department",
            "category",
            "category_slug",
            "farmer_types",
            "official_url",
            "last_verified_on",
            "status",
        ]


class SchemeDetailSerializer(serializers.ModelSerializer):
    category = SchemeCategorySerializer()
    state_name = serializers.CharField(
        source="state.name", default=None, allow_null=True
    )
    farmer_types = FarmerTypeSerializer(many=True, read_only=True)

    class Meta:
        model = Scheme
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "description",
            "level",
            "state_name",
            "department",
            "category",
            "farmer_types",
            "eligibility",
            "benefits",
            "documents_required",
            "how_to_apply",
            "official_url",
            "source_name",
            "source_url",
            "source_id",
            "last_verified_on",
            "status",
            "created_at",
            "updated_at",
        ]


class SchemeFacetItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    count = serializers.IntegerField()


class SchemeFacetsResponseSerializer(serializers.Serializer):
    categories = SchemeFacetItemSerializer(many=True)
    levels = SchemeFacetItemSerializer(many=True)
    farmer_types = SchemeFacetItemSerializer(many=True)
    states = SchemeFacetItemSerializer(many=True)
    total_active_schemes = serializers.IntegerField()
