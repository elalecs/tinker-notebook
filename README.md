# Tinker Notebook

A lightweight VS Code extension that enables interactive PHP and Laravel Tinker code execution directly in Markdown files. Tinker Notebook allows you to write, document, and execute PHP code within Markdown code blocks, providing immediate feedback without leaving your editor.

## Estado Actual

- ✅ **Fase 1**: Ejecución básica de código PHP desde archivos Markdown
- ✅ **Fase 2**: Ejecución diferenciada PHP/Tinker con detección de proyectos Laravel
- ✅ **Fase 3**: Gestión del estado de bloques de código con almacenamiento persistente
- ✅ **Fase 5**: Formateo mejorado de salida para diferentes tipos de datos

## Características Implementadas

- **Ejecución de Código**
  - Ejecución de bloques de código PHP (```php) usando el binario PHP del sistema
  - Ejecución de bloques Tinker (```tinker) usando php artisan tinker
  - Detección automática de proyectos Laravel en el workspace
  - Creación de proyectos Laravel temporales cuando sea necesario

- **Gestión de Estado**
  - Sistema de identificación de bloques con IDs personalizados (```php:id, ```tinker:id)
  - Seguimiento del estado de ejecución con indicadores visuales:
    - ▶️ No ejecutado
    - ⏹️ Ejecutando/parar ejecución
    - 🟢 Ejecutado correctamente
    - ❌ Error en ejecución
  - Persistencia del estado entre sesiones del editor

- **Referencia de Resultados**
  - Sistema de referencia entre bloques mediante sintaxis $tinker_outputs.id
  - Detección y prevención de referencias circulares
  - Información detallada al pasar el cursor sobre los bloques

- **Formateo de Salida**
  - Detección inteligente de tipos de salida (JSON, arrays, objetos, etc.)
  - Formateadores para diferentes tipos de datos con resaltado de sintaxis
  - Secciones colapsables para mejorar la legibilidad
  - Funcionalidad de exportación en varios formatos (JSON, CSV, Texto)

## Requisitos

- PHP 7.4+ (requerido)
- Composer & Laravel (opcional para bloques Tinker)

## Instalación

### Desde VS Code Marketplace (Próximamente)

1. Abre VS Code
2. Ve a Extensiones (Ctrl+Shift+X o Cmd+Shift+X)
3. Busca "Tinker Notebook"
4. Haz clic en Instalar
5. Recarga VS Code cuando se te solicite

### Instalación Manual

1. Descarga el archivo `.vsix` desde la [página de releases de GitHub](https://github.com/elalecs/tinker-notebook/releases)
2. En VS Code, ve a Extensiones (Ctrl+Shift+X)
3. Haz clic en el menú "..." en la parte superior derecha del panel de Extensiones
4. Selecciona "Install from VSIX..."
5. Navega y selecciona el archivo `.vsix` descargado
6. Recarga VS Code cuando se te solicite

## Uso

1. Crea o abre un archivo Markdown (`.md`)
2. Añade un bloque de código PHP usando triple backticks y el identificador de lenguaje `php` o `tinker`:

```markdown
# Mis Notas de PHP

Aquí hay un ejemplo simple de PHP:

```php
$greeting = "Hello, World!";
echo $greeting;

// También puedes usar variables
$name = "Tinker Notebook";
echo "Welcome to {$name}!";
```

```tinker:mi_consulta
// Este bloque se ejecutará con Laravel Tinker
$users = \App\Models\User::all();
return $users;
```

// Puedes referenciar resultados anteriores
```php
$data = $tinker_outputs.mi_consulta;
var_dump(count($data));
```
```

3. Coloca el cursor dentro del bloque de código
4. Presiona Ctrl+Enter (Cmd+Enter en Mac) para ejecutar el código
5. Visualiza los resultados en el panel Output

## Configuración de la Extensión

Esta extensión contribuye con las siguientes configuraciones:

* `tinker-notebook.phpPath`: Ruta al ejecutable de PHP (predeterminado: "php")
* `tinker-notebook.timeout`: Tiempo de espera para la ejecución de PHP en milisegundos (predeterminado: 30000)
* `tinker-notebook.laravelPath`: Ruta al proyecto Laravel para ejecución de Tinker (opcional)

## Atajos de Teclado

* `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac): Ejecutar el bloque de código en la posición actual del cursor

## Próximas Características

Estamos trabajando actualmente en:

- **Fase 6**: Biblioteca de snippets
- **Fase 7**: Características avanzadas como directivas especiales y formateadores personalizados

Consulta el archivo [TODO.md](TODO.md) para ver todas las características planificadas y mejoras.

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, consulta [CONTRIBUTING.md](CONTRIBUTING.md) para obtener información detallada sobre cómo configurar el entorno de desarrollo y contribuir al proyecto.

## Licencia

Esta extensión está licenciada bajo la Licencia MIT.

## Documentación
- [Guía de Contribución](CONTRIBUTING.md)
- [Plan de Desarrollo](TODO.md)