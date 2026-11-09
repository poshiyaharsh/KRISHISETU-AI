"""
Models for Indian administrative states and agricultural districts.
"""

from django.db import models


class State(models.Model):
    """Indian state or union territory."""

    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True, help_text="ISO/LGD state code (e.g. IN-GJ)")
    lat = models.FloatField(help_text="Centroid latitude")
    lon = models.FloatField(help_text="Centroid longitude")

    class Meta:
        ordering = ["name"]
        verbose_name = "State"
        verbose_name_plural = "States"

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class District(models.Model):
    """District within an Indian state."""

    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=100)
    lat = models.FloatField(help_text="District centroid latitude")
    lon = models.FloatField(help_text="District centroid longitude")
    coord_source = models.CharField(
        max_length=100,
        default="local_government_directory",
        help_text="Verifiable provenance of coordinates",
    )

    class Meta:
        ordering = ["name"]
        unique_together = ("state", "name")
        verbose_name = "District"
        verbose_name_plural = "Districts"

    def __str__(self) -> str:
        return f"{self.name}, {self.state.name}"
