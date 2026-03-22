import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancellationReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  reasons: string[];
  otherLabel?: string;
  alwaysShowCustomField?: boolean;
  customLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (reason: string) => Promise<void> | void;
}

const OTHER_REASON = 'Other';

const CancellationReasonDialog = ({
  open,
  onOpenChange,
  title,
  description,
  reasons,
  otherLabel = 'Please provide reason',
  alwaysShowCustomField = false,
  customLabel = 'Additional details (optional)',
  isSubmitting = false,
  onSubmit,
}: CancellationReasonDialogProps) => {
  const defaultReason = reasons[0] || OTHER_REASON;
  const [selectedReason, setSelectedReason] = useState(defaultReason);
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedReason(defaultReason);
      setCustomReason('');
    }
  }, [open, defaultReason]);

  const showCustomField = alwaysShowCustomField || selectedReason === OTHER_REASON;

  const finalReason = useMemo(() => {
    const custom = customReason.trim();
    if (selectedReason === OTHER_REASON) {
      return custom;
    }
    if (!custom) {
      return selectedReason;
    }
    return `${selectedReason} - ${custom}`;
  }, [selectedReason, customReason]);

  const canSubmit = finalReason.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }
    await onSubmit(finalReason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
            {reasons.map((reason) => {
              const id = `cancel-reason-${reason.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
              return (
                <div key={reason} className="flex items-center space-x-3 rounded-md border p-3">
                  <RadioGroupItem value={reason} id={id} />
                  <Label htmlFor={id} className="cursor-pointer font-normal">
                    {reason}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {showCustomField && (
            <div className="space-y-2">
              <Label htmlFor="cancel-custom-reason">
                {selectedReason === OTHER_REASON ? otherLabel : customLabel}
              </Label>
              <Textarea
                id="cancel-custom-reason"
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Type here..."
                className="min-h-[96px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationReasonDialog;