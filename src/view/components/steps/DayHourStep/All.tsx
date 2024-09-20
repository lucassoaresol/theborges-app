import { ErrorMessage } from '@hookform/error-message';
import { max, min, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMediaQuery } from 'react-responsive';

import { useWorkingDays } from '@/app/hooks/useWorkingDays';
import dayLib from '@/app/lib/dayjs';
import { WorkingDaysService } from '@/app/services/WorkingDaysService';
import { FormData } from '@/view/pages/Home';

import { StepHeader } from '../../StepHeader';
import { StepperFooter, StepperNextButton, StepperPreviousButton } from '../../Stepper';
import { useStepper } from '../../Stepper/useStepper';
import { Button } from '../../ui/Button';
import { Calendar } from '../../ui/Calendar';
import { Skeleton } from '../../ui/Skeleton';

export function DayHourStep() {
  const { isLoading, workingDays } = useWorkingDays();
  const { nextStep } = useStepper();
  const form = useFormContext<FormData>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hours, setHours] = useState<
    {
      display: string;
      total: number;
    }[]
  >();

  const isMaxW = useMediaQuery({
    query: '(max-width: 450px)',
  });

  const workingDayDates = useMemo(
    () =>
      workingDays.map((day) =>
        typeof day.date === 'string' ? parseISO(day.date) : day.date,
      ),
    [workingDays],
  );

  const minDate = useMemo(() => min(workingDayDates), [workingDayDates]);

  const maxDate = useMemo(() => max(workingDayDates), [workingDayDates]);

  const closedDays = useMemo(
    () =>
      workingDays
        .filter((day) => day.isClosed)
        .map((day) => (typeof day.date === 'string' ? parseISO(day.date) : day.date)),
    [workingDays],
  );

  async function handleNextStep() {
    const isValid = await form.trigger('dayHourStep', {
      shouldFocus: true,
    });

    if (isValid) {
      nextStep();
    }
  }

  useEffect(() => {
    const date = dayLib(selectedDate).format('YYYY-MM-DD');
    const requiredMinutes = form
      .getValues('serviceAddStep')
      .reduce((acc, service) => acc + service!.durationMinutes!, 0);
    form.setValue('dayHourStep.durationMinutes', requiredMinutes);
    form.setValue('dayHourStep.date', date);

    WorkingDaysService.getFreeTime({
      date,
      professionalId: 1,
      requiredMinutes,
    }).then((res) => {
      setHours(res);
    });
  }, [form, selectedDate]);

  return (
    <div>
      <StepHeader
        title="Data e Horário"
        description="Escolha a data e o horário desejados para agendar seu atendimento."
      />
      <div className={isMaxW ? '' : 'flex'}>
        {isLoading ? (
          <Skeleton className="h-[40px] w-full rounded-xl" />
        ) : (
          <Calendar
            mode="single"
            classNames={{
              month: `${isMaxW && 'flex flex-col'} space-y-4`,
              table: `${isMaxW ? 'self-center' : 'w-full'} border-collapse space-y-1`,
            }}
            fromDate={minDate}
            toDate={maxDate}
            disabled={closedDays}
            locale={ptBR}
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              form.setValue('dayHourStep.startTime', 0);
            }}
            weekStartsOn={1}
          />
        )}

        <div className={`grid grid-cols-${isMaxW ? '4' : '2'} gap-2 p-2`}>
          {hours &&
            hours.map((hr) => (
              <Button
                key={hr.total}
                variant={
                  form.getValues('dayHourStep.startTime') === hr.total
                    ? 'default'
                    : 'success'
                }
                onClick={() => {
                  const dayHourStep = form.getValues('dayHourStep');
                  form.setValue('dayHourStep', {
                    ...dayHourStep,
                    startTime: hr.total,
                  });
                }}
              >
                {hr.display}
              </Button>
            ))}
        </div>
      </div>
      <ErrorMessage
        errors={form.formState.errors}
        name="dayHourStep"
        render={({ message }) => (
          <small className="text-red-400 block mt-1 ml-1">{message}</small>
        )}
      />
      <StepperFooter>
        <StepperPreviousButton disabled={form.formState.isSubmitting} />
        <StepperNextButton onClick={handleNextStep} />
      </StepperFooter>
    </div>
  );
}
