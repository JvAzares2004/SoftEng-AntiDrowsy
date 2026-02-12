export interface Device {
  device_id?: number;
  customer_id: number;
  device_name: string;
  device_type: string;
  device_address?: string;
  paired_at?: Date;
  last_connected?: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}
