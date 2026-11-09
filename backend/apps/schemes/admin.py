from django.contrib import admin
from .models import SchemeCategory, FarmerType, Scheme


@admin.register(SchemeCategory)
class SchemeCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(FarmerType)
class FarmerTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "level",
        "category",
        "state",
        "status",
        "last_verified_on",
    )
    list_filter = ("level", "status", "category", "state", "last_verified_on")
    search_fields = ("name", "short_description", "department")
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("farmer_types",)
    readonly_fields = ("created_at", "updated_at")
