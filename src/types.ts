export const MACHINE_INTERESTS = ["linde", "toyota", "both", "other"] as const;

export type MachineInterest = (typeof MACHINE_INTERESTS)[number];

export type Inquiry = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
  machineInterest: MachineInterest;
  createdAt: string;
};
