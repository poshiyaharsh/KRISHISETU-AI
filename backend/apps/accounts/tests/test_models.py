"""
Tests for accounts models, constraints, and relationships (T13.2).
"""

from datetime import timedelta
import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.accounts.models import (
    EmailVerificationOTP,
    FarmerProfile,
    FarmPlot,
    IrrigationSource,
    LandAreaUnit,
    RefreshToken,
    SavedScheme,
    SoilType,
    User,
)
from apps.crops.models import PredictionRecord
from apps.locations.models import District, State
from apps.schemes.models import FarmerType, Scheme, SchemeCategory


@pytest.mark.django_db
def test_user_creation_and_constraints():
    """Verify User model fields, defaults, and uniqueness constraints."""
    user = User.objects.create(
        email="farmer@example.com",
        consented_at=timezone.now(),
        consent_version="1.0",
    )
    assert user.pk is not None
    assert user.is_active is True
    assert user.is_authenticated is True
    assert user.is_anonymous is False
    assert str(user) == "farmer@example.com"

    # Enforce email uniqueness
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            User.objects.create(email="farmer@example.com")


@pytest.mark.django_db
def test_email_verification_otp_model():
    """Verify EmailVerificationOTP properties and defaults."""
    now = timezone.now()
    otp = EmailVerificationOTP.objects.create(
        email="test@krishisetu.in",
        salt="randomsalt123",
        code_hash="sha256hashcode",
        expires_at=now + timedelta(minutes=10),
    )
    assert otp.attempts == 0
    assert otp.is_used is False
    assert "test@krishisetu.in" in str(otp)


@pytest.mark.django_db
def test_refresh_token_revocation():
    """Verify RefreshToken uniqueness and revocation flag."""
    user = User.objects.create(email="tokenuser@example.com")
    now = timezone.now()
    token = RefreshToken.objects.create(
        user=user,
        token_hash="hash_abc_123",
        expires_at=now + timedelta(days=30),
    )
    assert token.is_revoked is False
    token.is_revoked = True
    token.save(update_fields=["is_revoked"])
    assert token.is_revoked is True

    # Duplicate token hash is rejected
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            RefreshToken.objects.create(
                user=user,
                token_hash="hash_abc_123",
                expires_at=now + timedelta(days=30),
            )


@pytest.mark.django_db
def test_farmer_profile_and_plot_relationships():
    """Verify FarmerProfile 1:1 user binding and plot relationships."""
    state = State.objects.create(name="Gujarat", code="IN-GJ", lat=22.2587, lon=71.1924)
    district = District.objects.create(
        state=state, name="Rajkot", lat=22.3039, lon=70.8022
    )
    farmer_type = FarmerType.objects.create(slug="small", name="Small Farmer (1-2 Ha)")

    user = User.objects.create(email="patel@krishisetu.in")
    profile = FarmerProfile.objects.create(
        user=user,
        display_name="Rameshbhai Patel",
        preferred_language="gu",
        state=state,
        district=district,
        farmer_type=farmer_type,
        land_area_value=4.5,
        land_area_unit=LandAreaUnit.BIGHA,
        primary_irrigation_source=IrrigationSource.BOREWELL,
    )

    assert profile.pk is not None
    assert user.profile == profile
    assert str(profile) == "Profile of patel@krishisetu.in (Rameshbhai Patel)"

    # Create plots
    plot1 = FarmPlot.objects.create(
        profile=profile,
        name="East Orchard",
        area_value=2.0,
        area_unit=LandAreaUnit.BIGHA,
        soil_type=SoilType.BLACK,
        district=district,
        notes="Cotton grown last Kharif season",
    )
    assert plot1.pk is not None
    assert profile.plots.count() == 1
    assert "East Orchard" in str(plot1)


@pytest.mark.django_db
def test_saved_scheme_and_prediction_record_link():
    """Verify SavedScheme bookmarks and nullable PredictionRecord linking."""
    user = User.objects.create(email="schemefarmer@example.com")
    cat = SchemeCategory.objects.create(slug="credit", name="Credit")
    scheme = Scheme.objects.create(
        slug="pm-kisan-test",
        name="PM-KISAN Test",
        category=cat,
        level="central",
        official_url="https://pmkisan.gov.in/",
        last_verified_on=timezone.now().date(),
    )

    saved = SavedScheme.objects.create(user=user, scheme=scheme)
    assert saved.pk is not None
    assert user.saved_schemes.count() == 1

    # Unique constraint on (user, scheme)
    with transaction.atomic():
        with pytest.raises(IntegrityError):
            SavedScheme.objects.create(user=user, scheme=scheme)

    # Link user to PredictionRecord
    pred = PredictionRecord.objects.create(
        user=user,
        nitrogen=90,
        phosphorus=42,
        potassium=43,
        temperature=20.8,
        humidity=82.0,
        ph=6.5,
        rainfall=202.9,
        model_version="test-v1",
        results=[{"crop": "rice", "confidence": 0.98}],
    )
    assert pred.user == user
    assert user.predictions.count() == 1
