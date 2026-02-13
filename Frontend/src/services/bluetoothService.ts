// Bluetooth Low Energy Service for ESP32 Drowsiness Controller
// This service uses the Web Bluetooth API to communicate with the ESP32
/// <reference path="../types/bluetooth.d.ts" />

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const COMMAND_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const STATUS_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

interface BluetoothStatus {
  buzzer: boolean;
  vibrator: boolean;
}

class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private commandCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCallback: ((status: BluetoothStatus) => void) | null = null;

  // Check if Web Bluetooth is supported
  isSupported(): boolean {
    if (!navigator.bluetooth) {
      console.error('Web Bluetooth API is not available in this browser.');
      return false;
    }
    return true;
  }

  // Connect to ESP32 device
  async connect(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
      }

      console.log('Requesting Bluetooth device...');
      
      // Request device with name filter
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'ESP32-Drowsiness' },
          { services: [SERVICE_UUID] }
        ],
        optionalServices: [SERVICE_UUID]
      });

      console.log('Device selected:', this.device.name);

      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.server = await this.device.gatt!.connect();
      console.log('Connected to GATT server');

      // Get service
      const service = await this.server.getPrimaryService(SERVICE_UUID);
      console.log('Service found');

      // Get characteristics
      this.commandCharacteristic = await service.getCharacteristic(COMMAND_CHAR_UUID);
      console.log('Command characteristic found');

      this.statusCharacteristic = await service.getCharacteristic(STATUS_CHAR_UUID);
      console.log('Status characteristic found');

      // Subscribe to status notifications
      await this.statusCharacteristic.startNotifications();
      this.statusCharacteristic.addEventListener('characteristicvaluechanged', this.handleStatusChange.bind(this));
      console.log('Subscribed to status notifications');

      return true;
    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      if (error.message.includes('User cancelled')) {
        throw new Error('Connection cancelled by user');
      }
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  // Disconnect from device
  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
      console.log('Disconnected from device');
    }
    this.device = null;
    this.server = null;
    this.commandCharacteristic = null;
    this.statusCharacteristic = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.device?.gatt?.connected || false;
  }

  // Get device name
  getDeviceName(): string | null {
    return this.device?.name || null;
  }

  // Send command to ESP32
  private async sendCommand(command: string): Promise<void> {
    if (!this.isConnected() || !this.commandCharacteristic) {
      throw new Error('Device not connected');
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      await this.commandCharacteristic.writeValue(data);
      console.log('Command sent:', command);
    } catch (error: any) {
      console.error('Error sending command:', error);
      throw new Error(`Failed to send command: ${error.message}`);
    }
  }

  // Test buzzer with intensity (0-100%)
  async testBuzzer(intensity: number = 100): Promise<void> {
    // Clamp intensity to 0-100
    intensity = Math.max(0, Math.min(100, Math.round(intensity)));
    console.log(`Testing buzzer at ${intensity}% intensity (3 second duration)`);
    await this.sendCommand(`TEST:buzzer:${intensity}`);
  }

  // Test vibrator with intensity (0-100%)
  async testVibrator(intensity: number = 100): Promise<void> {
    // Clamp intensity to 0-100
    intensity = Math.max(0, Math.min(100, Math.round(intensity)));
    console.log(`Testing vibrator at ${intensity}% intensity (3 second duration)`);
    await this.sendCommand(`TEST:vibrator:${intensity}`);
  }

  // Test both devices with intensity (0-100%)
  async testBoth(intensity: number = 100): Promise<void> {
    // Clamp intensity to 0-100
    intensity = Math.max(0, Math.min(100, Math.round(intensity)));
    console.log(`Testing both devices at ${intensity}% intensity (3 second duration)`);
    await this.sendCommand(`TEST:both:${intensity}`);
  }

  // Control buzzer
  async controlBuzzer(state: boolean): Promise<void> {
    await this.sendCommand(`CONTROL:buzzer:${state ? 'on' : 'off'}`);
  }

  // Control vibrator
  async controlVibrator(state: boolean): Promise<void> {
    await this.sendCommand(`CONTROL:vibrator:${state ? 'on' : 'off'}`);
  }

  // Send alert with level
  async sendAlert(level: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Sending ${level} alert`);
    await this.sendCommand(`ALERT:${level}`);
  }

  // Stop all devices
  async stopAll(): Promise<void> {
    console.log('Stopping all devices');
    await this.sendCommand('STOP');
  }

  // Request status
  async requestStatus(): Promise<void> {
    await this.sendCommand('STATUS');
  }

  // Set status callback
  onStatusChange(callback: (status: BluetoothStatus) => void): void {
    this.statusCallback = callback;
  }

  // Handle status change notification
  private handleStatusChange(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value) return;

    const decoder = new TextDecoder();
    const statusString = decoder.decode(value);
    console.log('Status update:', statusString);

    // Parse status (format: "buzzer,vibrator" where 1=on, 0=off)
    const parts = statusString.split(',');
    if (parts.length >= 2) {
      const status: BluetoothStatus = {
        buzzer: parts[0] === '1',
        vibrator: parts[1] === '1'
      };

      if (this.statusCallback) {
        this.statusCallback(status);
      }
    }
  }

  // Handle disconnection
  private onDisconnected(): void {
    console.log('Device disconnected');
    this.device = null;
    this.server = null;
    this.commandCharacteristic = null;
    this.statusCharacteristic = null;
  }
}

// Export singleton instance
export default new BluetoothService();
