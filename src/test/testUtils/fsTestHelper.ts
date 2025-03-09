import * as path from 'path';
// Importación correcta de mock-fs
const mockFs = require('mock-fs');

export class FsTestHelper {
  public static setupMockFileSystem(): void {
    mockFs({
      '/workspace': {
        'project': {
          '.tinker-notebook': {
            'temp': {}
          },
          'file.php': '<?php echo "test";'
        },
        'laravel': {
          'artisan': '#!/usr/bin/env php',
          'composer.json': '{"name": "laravel/laravel"}'
        }
      },
      '/tmp': {
        'laravel-temp': {
          'artisan': '#!/usr/bin/env php',
          'composer.json': '{"name": "laravel/laravel"}'
        }
      }
    });
  }

  public static restoreFsSystem(): void {
    mockFs.restore();
  }
  
  public static createTempLaravelProject(basePath: string): void {
    const tempPath = path.join(basePath, '.tinker-notebook', 'laravel');
    mockFs({
      [tempPath]: {
        'artisan': '#!/usr/bin/env php',
        'composer.json': '{"name": "laravel/laravel"}'
      }
    });
  }
}