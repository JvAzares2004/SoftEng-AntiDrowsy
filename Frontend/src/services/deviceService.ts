const API_URL = 'http://localhost:3000';

export interface Device {
  device_id?: number;
  device_name: string;
  device_type: string;
  device_address?: string;
  paired_at?: Date;
  last_connected?: Date;
  is_active: boolean;
}

class DeviceService {
  async pairDevice(email: string, deviceName: string, deviceType: string, deviceAddress?: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_name: deviceName,
          device_type: deviceType,
          device_address: deviceAddress,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error pairing device:', error);
      throw error;
    }
  }

  async listDevices(email: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/list?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error listing devices:', error);
      throw error;
    }
  }

  async updateDevice(email: string, deviceId: number, updates: { device_name?: string; is_active?: boolean }): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_id: deviceId,
          ...updates,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  async disconnectDevice(email: string, deviceId: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_id: deviceId,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error disconnecting device:', error);
      throw error;
    }
  }

  async removeDevice(email: string, deviceId: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_id: deviceId,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error removing device:', error);
      throw error;
    }
  }

  async updateConnection(email: string, deviceId: number): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/device/update-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_id: deviceId,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }
}

export default new DeviceService();
