from django.urls import path

from .views import data_reconciliation


urlpatterns = [
    path('', data_reconciliation, name='data_reconciliation'),
]
