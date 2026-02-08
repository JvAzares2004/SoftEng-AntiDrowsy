import { Body, Controller, Post, Get, Put, Delete, Query, Param } from '@nestjs/common';
import { DatabaseService } from '../service/database/database.service';
import chalk from 'chalk';

console.log(chalk.bgGreen.black('[CONTROLLER] Device controller loaded'));

interface PairDeviceDto {
  email: string;
  device_name: string;
  device_type: string;
  device_address?: string;
}

interface UpdateDeviceDto {
  device_id: number;
  email: string;
  device_name?: string;
  is_active?: boolean;
}

interface DisconnectDeviceDto {
  device_id: number;
  email: string;
}

@Controller('device')
export class DeviceController {
  constructor(private readonly dbService: DatabaseService) {}

  @Post('pair')
  async pairDevice(@Body() body: PairDeviceDto) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue('[DEVICE] Pairing device request:'), body);

      // Validate input
      if (!body.device_name || body.device_name.trim().length === 0) {
        return {
          success: false,
          message: 'Device name cannot be empty',
        };
      }

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Check if device already exists for this user
      const existingDevice = await client.query(
        'SELECT device_id FROM devices WHERE customer_id = $1 AND device_name = $2',
        [customerId, body.device_name],
      );

      if (existingDevice.rows.length > 0) {
        // Update existing device
        const updateResult = await client.query(
          `UPDATE devices 
           SET device_type = $1, 
               device_address = $2, 
               paired_at = NOW(), 
               last_connected = NOW(),
               is_active = true,
               updated_at = NOW()
           WHERE device_id = $3
           RETURNING *`,
          [body.device_type, body.device_address, existingDevice.rows[0].device_id],
        );

        console.log(chalk.green('[DEVICE] Device updated successfully'));
        return {
          success: true,
          message: 'Device reconnected successfully',
          device: updateResult.rows[0],
        };
      }

      // Insert new device
      const result = await client.query(
        `INSERT INTO devices (customer_id, device_name, device_type, device_address, paired_at, last_connected, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW(), true, NOW(), NOW())
         RETURNING *`,
        [customerId, body.device_name, body.device_type, body.device_address || null],
      );

      console.log(chalk.green('[DEVICE] Device paired successfully'));
      return {
        success: true,
        message: 'Device paired successfully',
        device: result.rows[0],
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error pairing device:'), error);
      return {
        success: false,
        message: 'Failed to pair device',
        error: error.message,
      };
    }
  }

  @Get('list')
  async listDevices(@Query('email') email: string) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue('[DEVICE] Listing devices for:'), email);

      if (!email) {
        return {
          success: false,
          message: 'Email is required',
        };
      }

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Get all devices for this user
      const result = await client.query(
        `SELECT device_id, device_name, device_type, device_address, paired_at, last_connected, is_active, created_at, updated_at
         FROM devices
         WHERE customer_id = $1
         ORDER BY last_connected DESC`,
        [customerId],
      );

      console.log(chalk.green('[DEVICE] Found'), result.rows.length, 'devices');
      return {
        success: true,
        devices: result.rows,
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error listing devices:'), error);
      return {
        success: false,
        message: 'Failed to list devices',
        error: error.message,
      };
    }
  }

  @Put('update')
  async updateDevice(@Body() body: UpdateDeviceDto) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue('[DEVICE] Updating device:'), body);

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Verify device belongs to user
      const deviceResult = await client.query(
        'SELECT device_id FROM devices WHERE device_id = $1 AND customer_id = $2',
        [body.device_id, customerId],
      );

      if (deviceResult.rows.length === 0) {
        return {
          success: false,
          message: 'Device not found or does not belong to user',
        };
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (body.device_name !== undefined) {
        updates.push(`device_name = $${paramIndex++}`);
        values.push(body.device_name);
      }

      if (body.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(body.is_active);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 0) {
        return {
          success: false,
          message: 'No fields to update',
        };
      }

      values.push(body.device_id);
      const query = `UPDATE devices SET ${updates.join(', ')} WHERE device_id = $${paramIndex} RETURNING *`;

      const result = await client.query(query, values);

      console.log(chalk.green('[DEVICE] Device updated successfully'));
      return {
        success: true,
        message: 'Device updated successfully',
        device: result.rows[0],
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error updating device:'), error);
      return {
        success: false,
        message: 'Failed to update device',
        error: error.message,
      };
    }
  }

  @Post('disconnect')
  async disconnectDevice(@Body() body: DisconnectDeviceDto) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue('[DEVICE] Disconnecting device:'), body);

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Set device as inactive
      const result = await client.query(
        `UPDATE devices 
         SET is_active = false, updated_at = NOW()
         WHERE device_id = $1 AND customer_id = $2
         RETURNING *`,
        [body.device_id, customerId],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Device not found or does not belong to user',
        };
      }

      console.log(chalk.green('[DEVICE] Device disconnected successfully'));
      return {
        success: true,
        message: 'Device disconnected successfully',
        device: result.rows[0],
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error disconnecting device:'), error);
      return {
        success: false,
        message: 'Failed to disconnect device',
        error: error.message,
      };
    }
  }

  @Delete('remove')
  async removeDevice(@Body() body: DisconnectDeviceDto) {
    const client = this.dbService.getClient();

    try {
      console.log(chalk.blue('[DEVICE] Removing device:'), body);

      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Delete device
      const result = await client.query(
        'DELETE FROM devices WHERE device_id = $1 AND customer_id = $2 RETURNING *',
        [body.device_id, customerId],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Device not found or does not belong to user',
        };
      }

      console.log(chalk.green('[DEVICE] Device removed successfully'));
      return {
        success: true,
        message: 'Device removed successfully',
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error removing device:'), error);
      return {
        success: false,
        message: 'Failed to remove device',
        error: error.message,
      };
    }
  }

  @Post('update-connection')
  async updateConnection(@Body() body: { device_id: number; email: string }) {
    const client = this.dbService.getClient();

    try {
      // Get customer_id from email
      const customerResult = await client.query(
        'SELECT customer_id FROM user_customers WHERE email = $1',
        [body.email],
      );

      if (customerResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const customerId = customerResult.rows[0].customer_id;

      // Update last connected time
      const result = await client.query(
        `UPDATE devices 
         SET last_connected = NOW(), updated_at = NOW()
         WHERE device_id = $1 AND customer_id = $2
         RETURNING *`,
        [body.device_id, customerId],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Device not found',
        };
      }

      return {
        success: true,
        message: 'Connection time updated',
        device: result.rows[0],
      };
    } catch (error) {
      console.error(chalk.red('[DEVICE] Error updating connection:'), error);
      return {
        success: false,
        message: 'Failed to update connection',
        error: error.message,
      };
    }
  }
}
