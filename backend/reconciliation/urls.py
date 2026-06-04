from django.urls import path

from .views import data_reconciliation, intake_discovery_stream


urlpatterns = [
    path('', data_reconciliation, name='data_reconciliation'),
    path('intake-discovery/stream', intake_discovery_stream, name='intake_discovery_stream'),
]
