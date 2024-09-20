import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { ClientService } from '@/app/services/ClientService';

import { Stepper } from '../components/Stepper';
import { CategoryStep } from '../components/steps/CategoryStep';
import { categoryStepSchema } from '../components/steps/CategoryStep/schema';
import { ConfirmedClientStep } from '../components/steps/ConfirmedStep';
import { confirmedClientStepSchema } from '../components/steps/ConfirmedStep/schema';
import { DayHourStep } from '../components/steps/DayHourStep';
import { dayHourStepSchema } from '../components/steps/DayHourStep/schema';
import { ServiceAddStep } from '../components/steps/ServiceAddStep';
import { serviceAddStepSchema } from '../components/steps/ServiceAddStep/schema';
import { ServiceStep } from '../components/steps/ServiceStep';
import { serviceStepSchema } from '../components/steps/ServiceStep/schema';
import { Skeleton } from '../components/ui/Skeleton';

const schema = z.object({
  categoryStep: categoryStepSchema,
  serviceStep: serviceStepSchema,
  serviceAddStep: serviceAddStepSchema,
  dayHourStep: dayHourStepSchema,
  confirmedStep: confirmedClientStepSchema,
});

export type FormData = z.infer<typeof schema>;

export function Client() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setLoading(true);
    if (id) {
      ClientService.get(id)
        .then((res) => {
          form.setValue('confirmedStep.clientId', res.id);
          form.setValue('confirmedStep.clientName', res.name);
        })
        .catch(() => navigate('/agendar'))
        .finally(() => setLoading(false));
    } else {
      navigate('/agendar');
    }
  }, [form, id, navigate]);

  useEffect(() => {
    const { unsubscribe } = form.watch((formData) => {
      sessionStorage.setItem('onboarding-form', JSON.stringify(formData));
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  const handleSubmit = form.handleSubmit(() => {});

  return (
    <div className="flex flex-col justify-center mx-auto max-w-[480px] p-6">
      {loading ? (
        <Skeleton className="h-[40px] w-full rounded-xl" />
      ) : (
        <FormProvider {...form}>
          <form onSubmit={handleSubmit}>
            <Stepper
              steps={[
                { label: 'Categoria', content: <CategoryStep /> },
                {
                  label: 'Serviço',
                  content: <ServiceStep />,
                },
                {
                  label: 'Serviços Adicionais',
                  content: <ServiceAddStep />,
                },
                {
                  label: 'Data e Horário',
                  content: <DayHourStep />,
                },
                {
                  label: 'Confirmação',
                  content: <ConfirmedClientStep />,
                },
              ]}
            />
          </form>
        </FormProvider>
      )}
    </div>
  );
}
