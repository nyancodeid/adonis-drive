/*
 * @adonisjs/drive
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DisksList, DriveConfig } from '@ioc:Adonis/Core/Drive'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Registers drive with the IoC container
 */
export default class DriveProvider {
  constructor(protected app: ApplicationContract) {}

  /**
   * Register drive with the container
   */
  protected registerDrive() {
    this.app.container.singleton('Adonis/Core/Drive', () => {
      const { DriveManager } = require('../src/DriveManager')
      const Router = this.app.container.resolveBinding('Adonis/Core/Route')
      const Config = this.app.container.resolveBinding('Adonis/Core/Config')

      const driveConfig: DriveConfig = Config.get('drive', {})
      if (!driveConfig) {
        throw new Error(
          'Missing configuration for drive. Visit https://bit.ly/2WnR5j9 for setup instructions'
        )
      }

      return new DriveManager(this.app, Router, driveConfig)
    })
  }

  /**
   * Register routes for disks using "local" driver.
   */
  protected defineDriveRoutes() {
    this.app.container.withBindings(
      ['Adonis/Core/Config', 'Adonis/Core/Route'],
      (Config, Router) => {
        /**
         * Do not attempt to resolve Drive from the container when there is
         * no configuration in place.
         *
         * This is a make shift arrangement. Later, we will have a universal
         * approach to disabling modules
         */
        const driveConfig: DriveConfig = Config.get('drive', {})
        if (!driveConfig) {
          return
        }

        const Drive = this.app.container.resolveBinding('Adonis/Core/Drive')
        const { LocalFileServer } = require('../src/LocalFileServer')

        Object.keys(driveConfig.disks).forEach((diskName: keyof DisksList) => {
          const diskConfig = driveConfig.disks[diskName]
          if (diskConfig.driver === 'local' && diskConfig.serveAssets) {
            new LocalFileServer(diskName, diskConfig, Drive.use(diskName), Router).registerRoute()
          }
        })
      }
    )
  }

  /**
   * Registering all required bindings to the container
   */
  public register() {
    this.registerDrive()
  }

  /**
   * Register drive routes
   */
  public boot() {
    this.defineDriveRoutes()
  }
}
