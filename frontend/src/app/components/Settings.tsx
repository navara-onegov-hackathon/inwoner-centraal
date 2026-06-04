import { Switch } from '@radix-ui/react-switch';
import { useState } from 'react';

export function Settings() {
  const [notifications, setNotifications] = useState({
    autoSave: true,
    suggestions: true,
    reminders: false,
    emailSteps: true,
    emailNotifications: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Instellingen</h1>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-semibold text-lg mb-4">Wat kan ik waar vinden?</h2>

          <div className="space-y-6">
            {/* Labels */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Labels van veranderingen</h3>
              <p className="text-sm text-gray-600 mb-4">
                Dit kan een mogelijk lijst zijn voor u en uw situatie. Daarom kunt u in de tweede drie maanden na het overlijden van uw naaste niet verwijzen met uw situatie.
              </p>
            </div>

            {/* Settings Options */}
            <div className="space-y-4">
              <div className="flex items-start justify-between py-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Heeft u hulp nodig?</h4>
                  <p className="text-sm text-gray-600">
                    Kijk op de knop "Hulp hulp nodig" bovenaan de pagina voor ondersteuning en het persoonlijk
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-t border-gray-100">
                <div className="flex-1 pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">Ondervinding vanuit de overheid</h4>
                  <p className="text-sm text-gray-600">
                    Om u te helpen kunnen organisaties opnemen van de overheid gegevens voor uw staatsnummer bevaarnaam. Deze wordt onderaan de pagina. Daarnaast kunnen wij de eerste tijd van uw dienst wijzigingen en niet mogelijk meeten kijken. Geef toestemming of zon verbinden naar ons dienstverleningen om meteen verbinding te maken. Heefit u dit later doen? Ga dan verder zonder het toestemming te geven en bedenk u met later.
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleNotification('autoSave')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.autoSave ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.autoSave ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-t border-gray-100">
                <div className="flex-1 pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">Suggesties te doen welke instanties of uw kant informeren</h4>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleNotification('suggestions')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.suggestions ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.suggestions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-t border-gray-100">
                <div className="flex-1 pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">Meldingen ontvangen</h4>
                  <p className="text-sm text-gray-600">
                    U krijgt zelf welke meldingen u ontvangt. Met de echtschieding herinnert kunt u per onderwerp aangeven of meldingen over uw onderwerpen breng. Zie ons de knop op 'aan'. Gaat deze op uw situten en u meldingen over uw onderverp. Let op: dan mag u niet als knop de knop niet uit.
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleNotification('reminders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.reminders ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.reminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-t border-gray-100">
                <div className="flex-1 pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">E-mails bij belangrijke stappen of herinneringen</h4>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleNotification('emailSteps')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.emailSteps ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.emailSteps ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between py-3 border-t border-gray-100">
                <div className="flex-1 pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">Notificaties in MijnOverheid</h4>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleNotification('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.emailNotifications ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="py-3 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-1">Gebruik maken van de D-wallet</h4>
                <p className="text-sm text-gray-600">
                  De D-wallet kan u helpen met het regelen van starter taken. Met de D-wallet komt binnenkort bepaalde van 'Afgeronden-regelen', bijvoorbeeld bij het aanvragen van dienst, namen. Is te regelen. Lees hier meer over uw D-wallets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Stappenplan</h2>
      </div>
    </div>
  );
}
