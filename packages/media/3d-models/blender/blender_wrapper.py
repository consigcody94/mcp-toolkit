#!/usr/bin/env python3
"""
Blender Wrapper - CLI interface for Blender operations
Provides command-line interface for TypeScript to invoke Blender operations
"""

import sys
import json
import argparse
from pathlib import Path


def run_blender_script(script_name: str, args: list) -> dict:
    """
    Run a Blender script with arguments

    Args:
        script_name: Name of the Blender Python script to run
        args: Arguments to pass to the script

    Returns:
        Dictionary with execution results
    """
    import subprocess

    # Find Blender executable
    blender_paths = [
        '/usr/bin/blender',
        '/usr/local/bin/blender',
        '/Applications/Blender.app/Contents/MacOS/Blender',
        'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe',
    ]

    blender_exe = None
    for path in blender_paths:
        if Path(path).exists():
            blender_exe = path
            break

    if not blender_exe:
        return {
            'success': False,
            'error': 'Blender executable not found. Please install Blender or set BLENDER_PATH environment variable.'
        }

    # Build command
    script_path = Path(__file__).parent / script_name
    cmd = [
        blender_exe,
        '--background',
        '--python', str(script_path),
        '--'
    ] + args

    try:
        # Run command
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        # Parse JSON output if available
        try:
            output_data = json.loads(result.stdout)
            return {
                'success': result.returncode == 0,
                'data': output_data,
                'stderr': result.stderr
            }
        except json.JSONDecodeError:
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr
            }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Blender operation timed out (5 minutes)'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def main():
    parser = argparse.ArgumentParser(description='Blender Wrapper CLI')
    parser.add_argument('command', help='Command to execute')
    parser.add_argument('--input', help='Input file path')
    parser.add_argument('--output', help='Output file or directory path')
    parser.add_argument('--formats', help='Export formats (comma-separated)')
    parser.add_argument('--target-polys', type=int, help='Target polygon count')
    parser.add_argument('--platform', help='Target platform (vrchat_pc, vrchat_quest, imvu, secondlife)')
    parser.add_argument('--quality', help='Quality preset (fast, balanced, quality)')
    parser.add_argument('--resolution', type=int, default=2048, help='Texture resolution')
    parser.add_argument('--samples', type=int, default=64, help='Baking samples')
    parser.add_argument('--lod-levels', type=int, default=5, help='Number of LOD levels')

    args = parser.parse_args()

    result = None

    if args.command == 'import_export':
        # Import and export to multiple formats
        if not args.input or not args.output:
            print(json.dumps({'success': False, 'error': 'Missing --input or --output'}))
            sys.exit(1)

        formats = args.formats or 'obj,fbx'
        result = run_blender_script('automation.py', [
            'import_export',
            args.input,
            args.output,
            formats
        ])

    elif args.command == 'cleanup':
        # Clean up mesh
        if not args.input or not args.output:
            print(json.dumps({'success': False, 'error': 'Missing --input or --output'}))
            sys.exit(1)

        result = run_blender_script('automation.py', [
            'cleanup',
            args.input,
            args.output
        ])

    elif args.command == 'stats':
        # Get mesh statistics
        if not args.input:
            print(json.dumps({'success': False, 'error': 'Missing --input'}))
            sys.exit(1)

        result = run_blender_script('automation.py', [
            'stats',
            args.input
        ])

    elif args.command == 'optimize':
        # Optimize mesh for platform
        if not args.input or not args.output or not args.platform:
            print(json.dumps({'success': False, 'error': 'Missing --input, --output, or --platform'}))
            sys.exit(1)

        # This would need a dedicated script, for now return placeholder
        result = {
            'success': True,
            'message': 'Optimization script to be implemented'
        }

    elif args.command == 'generate_lods':
        # Generate LOD levels
        if not args.input or not args.output:
            print(json.dumps({'success': False, 'error': 'Missing --input or --output'}))
            sys.exit(1)

        result = {
            'success': True,
            'message': 'LOD generation script to be implemented'
        }

    elif args.command == 'bake_textures':
        # Bake PBR textures
        if not args.input or not args.output:
            print(json.dumps({'success': False, 'error': 'Missing --input or --output'}))
            sys.exit(1)

        result = {
            'success': True,
            'message': 'Texture baking script to be implemented'
        }

    else:
        result = {
            'success': False,
            'error': f'Unknown command: {args.command}'
        }

    # Output result as JSON
    print(json.dumps(result))

    # Exit with appropriate code
    sys.exit(0 if result.get('success') else 1)


if __name__ == '__main__':
    main()
