"""
Django admin configuration for Accounts and Farmer Profiles.
"""

from django.contrib import admin

from .models import (
    EmailVerificationOTP,
    FarmerProfile,
    FarmPlot,
    RefreshToken,
    SavedScheme,
    User,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "created_at", "last_login", "consented_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("email",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "last_login")


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    list_display = ("email", "attempts", "expires_at", "created_at", "is_used")
    list_filter = ("is_used", "created_at")
    search_fields = ("email",)
    readonly_fields = ("salt", "code_hash", "created_at")


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "expires_at", "created_at", "is_revoked")
    list_filter = ("is_revoked", "created_at")
    search_fields = ("user__email",)
    readonly_fields = ("token_hash", "created_at")


class FarmPlotInline(admin.TabularInline):
    model = FarmPlot
    extra = 0
    max_num = 5


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "display_name",
        "preferred_language",
        "state",
        "district",
        "land_area_value",
        "land_area_unit",
    )
    list_filter = ("preferred_language", "primary_irrigation_source", "land_area_unit")
    search_fields = ("user__email", "display_name")
    inlines = [FarmPlotInline]


@admin.register(FarmPlot)
class FarmPlotAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "profile",
        "area_value",
        "area_unit",
        "soil_type",
        "district",
    )
    list_filter = ("area_unit", "soil_type")
    search_fields = ("name", "profile__user__email")


@admin.register(SavedScheme)
class SavedSchemeAdmin(admin.ModelAdmin):
    list_display = ("user", "scheme", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "scheme__slug", "scheme__name_en")
