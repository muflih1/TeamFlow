import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PropsWithOnClose } from "@/contexts/dialog-context";

export function UpdateChannelDialog({onClose}: PropsWithOnClose) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}