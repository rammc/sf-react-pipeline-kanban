import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';

export interface InlineEditAmountProps {
  initialAmount: number | null;
  onSave: (next: number) => Promise<void>;
  onCancel: () => void;
}

interface FormValues {
  amount: string; // raw input value — converted to number on submit
}

/**
 * Inline form for editing a single Opportunity's Amount.
 *
 * Optimistic update + rollback live in the parent (KanbanBoard) — this
 * component only handles input state, validation, and submit/cancel.
 * Same separation as DraggableOpportunityCard vs handleDragEnd: the
 * card knows about UX, the board knows about server state.
 */
export function InlineEditAmount({
  initialAmount,
  onSave,
  onCancel,
}: InlineEditAmountProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { amount: initialAmount?.toString() ?? '' },
  });

  // Auto-focus the input on mount so click-to-edit feels right.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function onSubmit(values: FormValues) {
    const trimmed = values.amount.trim();
    const next = trimmed === '' ? 0 : Number.parseFloat(trimmed);
    if (Number.isNaN(next) || next < 0) {
      // Silently keep the form open on invalid input. A toast or
      // FormState.errors view would be the next teaching upgrade.
      return;
    }
    if (next === initialAmount) {
      onCancel();
      return;
    }
    await onSave(next);
  }

  const { ref: rhfRef, ...amountReg } = register('amount');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'Escape') onCancel();
      }}
      className="flex items-center gap-1"
    >
      <span className="text-xs text-muted-foreground">$</span>
      <Input
        {...amountReg}
        ref={el => {
          rhfRef(el);
          inputRef.current = el;
        }}
        type="number"
        step="100"
        min="0"
        disabled={isSubmitting}
        className="h-6 w-24 px-1 text-xs"
        aria-label={`Edit amount (current ${formatCurrency(initialAmount)})`}
      />
    </form>
  );
}
