import { Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function StepPlan() {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = [
    {
      id: 1,
      title: 'Begin hier met deze 2 taken afhandelen',
      completed: false,
      substeps: [
        'Alles een inschrijfnummer aanvragen'
      ]
    },
    {
      id: 2,
      title: 'Alles van inschrijven aanvragen',
      description: 'U heeft uw organisatie als eerste stap ingeschreven bij de gemeente waar het...',
      organization: 'Organisatie',
      completed: true,
      deadline: '4 april 2025',
      action: 'Aanvragen bij gemeente',
      actionType: 'Verzonden'
    },
    {
      id: 3,
      title: 'Verklaring van erfrecht aanvragen',
      description: 'Vraag een verklaring van erfrecht aan bij een notaris en maatschap.',
      action: 'Stap te doen',
      actionType: 'Opgeschoold'
    },
    {
      id: 4,
      title: 'Nabetekendemeeentvoudigheid aanvragen',
      description: 'U heeft als werkgever de verplichting om nabestaanden af te dragen.',
      action: 'Stap te doen',
      actionType: 'Opgeschoold'
    },
    {
      id: 5,
      title: 'Kandidaats op rasen zetten',
      description: 'Moet een nabestaande bepalin krijgen door uw zorg te verzorgen.',
      action: 'Stap te doen',
      actionType: 'Opgeschoold'
    },
    {
      id: 6,
      title: 'Voorberge aanslag ontvangen of stoppen',
      description: 'Als u een vennootschap bent begin ook de aanslag te verzorgen.',
      action: 'Stap te doen',
      actionType: 'Opgeschoold'
    },
    {
      id: 7,
      title: 'Geadresseerde reclamepost stoppen',
      description: 'U moet het verzenden aangeven als er uw gedeelt verzorgen.',
      action: 'Stap te doen',
      actionType: 'Opgeschoold'
    }
  ];

  const toggleStep = (stepId: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Stappenplan</h1>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-8">
        <button className="pb-3 px-1 border-b-2 border-blue-600 text-blue-600 font-medium">
          Nog te doen
        </button>
        <button className="pb-3 px-1 text-gray-600 hover:text-gray-900">
          Gedaan
        </button>
        <button className="pb-3 px-1 text-gray-600 hover:text-gray-900">
          Wat doen wij?
        </button>
        <button className="pb-3 px-1 text-gray-600 hover:text-gray-900">
          Hoe heeft u inloglijk nodig op
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-4 mb-6">
        <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
          <option>Alle organisaties</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
          <option>Spoed (hoog - laag)</option>
        </select>
      </div>

      {/* Steps */}
      <div className="space-y-4 max-w-4xl">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`bg-white rounded-lg border transition-all ${
              completedSteps.has(step.id) || step.completed
                ? 'border-green-300 bg-green-50'
                : index === 0
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    completedSteps.has(step.id) || step.completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300 hover:border-blue-600'
                  }`}
                >
                  {(completedSteps.has(step.id) || step.completed) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>

                  {step.description && (
                    <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  )}

                  {step.organization && (
                    <div className="flex items-center gap-8 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Organisatie</span>
                        <p className="font-medium text-gray-900">{step.organization}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Uiterlijk</span>
                        <p className="font-medium text-gray-900">{step.deadline}</p>
                      </div>
                    </div>
                  )}

                  {step.substeps && (
                    <p className="text-sm text-gray-700 mb-4">{step.substeps[0]}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                      {step.action || 'Aanvragen bij gemeente'}
                    </button>
                    {step.actionType === 'Verzonden' ? (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                        Verzonden
                      </span>
                    ) : step.actionType === 'Opgeschoold' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                        Opgeschoold
                      </span>
                    )}
                  </div>
                </div>

                <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                  Stap te doen
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
