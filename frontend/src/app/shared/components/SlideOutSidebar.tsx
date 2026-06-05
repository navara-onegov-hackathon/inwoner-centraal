import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '../../legacy/components/ui/sheet';
import { AppSidebar } from './AppSidebar';

interface SlideOutSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SlideOutSidebar({
  open,
  onOpenChange,
  activeSection,
  onSectionChange,
}: SlideOutSidebarProps) {
  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        id="app-sidebar"
        side="left"
        className="!top-12 !bottom-0 !h-[calc(100dvh-3rem)] w-72 max-w-[18rem] gap-0 border-r border-gray-200/80 bg-[#f7f7f7] p-0 shadow-xl sm:max-w-[18rem] [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Navigatiemenu</SheetTitle>
        <SheetDescription className="sr-only">
          Hoofdnavigatie van MijnOverheid
        </SheetDescription>
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
