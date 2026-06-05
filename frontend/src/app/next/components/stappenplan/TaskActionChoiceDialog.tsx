import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../legacy/components/ui/alert-dialog';

interface TaskActionChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  taskTitle: string;
  taskOrganisatie: string;
  processing: boolean;
  onChooseAutomatic: () => void;
  onChooseSelf: () => void;
}

export function TaskActionChoiceDialog({
  open,
  onOpenChange,
  actionLabel,
  taskTitle,
  taskOrganisatie,
  processing,
  onChooseAutomatic,
  onChooseSelf,
}: TaskActionChoiceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-gray-200 bg-white sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">Hoe wilt u verder?</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-gray-600">
            U staat op het punt om <span className="font-medium text-gray-800">{actionLabel}</span>{' '}
            uit te voeren voor <span className="font-medium text-gray-800">{taskTitle}</span>.
            Wilt u dat wij dit automatisch proberen te regelen, of doet u het liever zelf?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-[#007AC8]/15 bg-[#E8F4FC]/40 px-4 py-3 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Automatisch regelen</p>
          <p className="mt-1 leading-relaxed">
            Wij proberen dit voor u te regelen en schakelen waar nodig met {taskOrganisatie}. U
            hoeft nu niets te doen.
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={processing}
            onClick={onChooseSelf}
            className="border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            Ik doe het zelf
          </AlertDialogCancel>
          <button
            type="button"
            disabled={processing}
            onClick={onChooseAutomatic}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#007AC8] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {processing ? 'Bezig...' : 'Regel automatisch voor mij'}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
