export interface QuizStep {
  question: string;
  field: keyof FormData;
  type: 'text' | 'email' | 'tel' | 'address' | 'select' | 'range' | 'file';
  placeholder?: string;
  icon: JSX.Element;
  subtext?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  homeOwnership: string;
  electricityBill: string;
  pdf: File | null;
}