"""
Blender Automation - Core headless Blender operations
Handles mesh import, cleanup, processing, and multi-format export
"""

import bpy
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json


class BlenderAutomation:
    """
    Core Blender automation for headless 3D processing
    Handles scene management, mesh operations, and exports
    """

    def __init__(self, headless: bool = True):
        """
        Initialize Blender automation

        Args:
            headless: Run without UI (default: True)
        """
        self.headless = headless
        self._setup_scene()

    def _setup_scene(self):
        """Setup clean Blender scene for processing"""
        # Delete default objects (cube, light, camera)
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        # Set units to metric
        bpy.context.scene.unit_settings.system = 'METRIC'
        bpy.context.scene.unit_settings.scale_length = 1.0

    def import_obj(self, filepath: str) -> bool:
        """
        Import OBJ file into Blender scene

        Args:
            filepath: Path to OBJ file

        Returns:
            Success status
        """
        try:
            bpy.ops.import_scene.obj(filepath=filepath)
            return True
        except Exception as e:
            print(f"Error importing OBJ: {e}", file=sys.stderr)
            return False

    def import_fbx(self, filepath: str) -> bool:
        """
        Import FBX file into Blender scene

        Args:
            filepath: Path to FBX file

        Returns:
            Success status
        """
        try:
            bpy.ops.import_scene.fbx(filepath=filepath)
            return True
        except Exception as e:
            print(f"Error importing FBX: {e}", file=sys.stderr)
            return False

    def export_obj(self, filepath: str, apply_modifiers: bool = True) -> bool:
        """
        Export scene to OBJ format

        Args:
            filepath: Output OBJ path
            apply_modifiers: Apply modifiers before export

        Returns:
            Success status
        """
        try:
            # Ensure output directory exists
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            bpy.ops.export_scene.obj(
                filepath=filepath,
                use_selection=False,
                use_materials=True,
                use_triangles=False,
                use_normals=True,
                use_uvs=True,
                use_mesh_modifiers=apply_modifiers,
            )
            return True
        except Exception as e:
            print(f"Error exporting OBJ: {e}", file=sys.stderr)
            return False

    def export_fbx(
        self,
        filepath: str,
        apply_modifiers: bool = True,
        use_armature: bool = True
    ) -> bool:
        """
        Export scene to FBX format

        Args:
            filepath: Output FBX path
            apply_modifiers: Apply modifiers before export
            use_armature: Include armature/rig if present

        Returns:
            Success status
        """
        try:
            # Ensure output directory exists
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            bpy.ops.export_scene.fbx(
                filepath=filepath,
                use_selection=False,
                use_mesh_modifiers=apply_modifiers,
                use_armature_deform_only=use_armature,
                add_leaf_bones=False,
                bake_anim=False,
                path_mode='AUTO',
            )
            return True
        except Exception as e:
            print(f"Error exporting FBX: {e}", file=sys.stderr)
            return False

    def export_gltf(self, filepath: str, draco_compression: bool = False) -> bool:
        """
        Export scene to GLTF/GLB format

        Args:
            filepath: Output GLTF path
            draco_compression: Use Draco mesh compression

        Returns:
            Success status
        """
        try:
            # Ensure output directory exists
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            # Determine format from extension
            export_format = 'GLB' if filepath.endswith('.glb') else 'GLTF_SEPARATE'

            bpy.ops.export_scene.gltf(
                filepath=filepath,
                export_format=export_format,
                export_draco_mesh_compression_enable=draco_compression,
                export_texcoords=True,
                export_normals=True,
                export_materials='EXPORT',
            )
            return True
        except Exception as e:
            print(f"Error exporting GLTF: {e}", file=sys.stderr)
            return False

    def export_dae(self, filepath: str) -> bool:
        """
        Export scene to Collada DAE format (for Second Life)

        Args:
            filepath: Output DAE path

        Returns:
            Success status
        """
        try:
            # Ensure output directory exists
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            bpy.ops.wm.collada_export(
                filepath=filepath,
                apply_modifiers=True,
                export_mesh_type_selection='view',
                selected=False,
                include_children=True,
                include_armatures=True,
                deform_bones_only=False,
            )
            return True
        except Exception as e:
            print(f"Error exporting DAE: {e}", file=sys.stderr)
            return False

    def cleanup_mesh(self, remove_doubles: bool = True, distance: float = 0.0001) -> bool:
        """
        Clean up mesh geometry

        Args:
            remove_doubles: Merge duplicate vertices
            distance: Merge distance for doubles

        Returns:
            Success status
        """
        try:
            # Select all mesh objects
            bpy.ops.object.select_all(action='DESELECT')
            for obj in bpy.context.scene.objects:
                if obj.type == 'MESH':
                    obj.select_set(True)

            if not bpy.context.selected_objects:
                return True

            bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]

            # Enter edit mode
            bpy.ops.object.mode_set(mode='EDIT')

            # Select all geometry
            bpy.ops.mesh.select_all(action='SELECT')

            # Remove doubles/merge by distance
            if remove_doubles:
                bpy.ops.mesh.remove_doubles(threshold=distance)

            # Recalculate normals
            bpy.ops.mesh.normals_make_consistent(inside=False)

            # Delete loose vertices/edges
            bpy.ops.mesh.delete_loose()

            # Back to object mode
            bpy.ops.object.mode_set(mode='OBJECT')

            return True
        except Exception as e:
            print(f"Error cleaning mesh: {e}", file=sys.stderr)
            return False

    def get_mesh_stats(self) -> Dict:
        """
        Get statistics for all meshes in scene

        Returns:
            Dictionary with mesh statistics
        """
        stats = {
            "mesh_count": 0,
            "total_vertices": 0,
            "total_faces": 0,
            "total_triangles": 0,
            "meshes": []
        }

        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                mesh = obj.data
                stats["mesh_count"] += 1
                stats["total_vertices"] += len(mesh.vertices)
                stats["total_faces"] += len(mesh.polygons)

                # Count triangles (faces can be quads or n-gons)
                triangles = sum(1 if len(poly.vertices) == 3 else len(poly.vertices) - 2
                               for poly in mesh.polygons)
                stats["total_triangles"] += triangles

                stats["meshes"].append({
                    "name": obj.name,
                    "vertices": len(mesh.vertices),
                    "faces": len(mesh.polygons),
                    "triangles": triangles,
                })

        return stats

    def unwrap_uvs(self, method: str = 'smart') -> bool:
        """
        UV unwrap all meshes

        Args:
            method: Unwrap method ('smart', 'cube', 'sphere', 'cylinder')

        Returns:
            Success status
        """
        try:
            # Select all mesh objects
            bpy.ops.object.select_all(action='DESELECT')
            for obj in bpy.context.scene.objects:
                if obj.type == 'MESH':
                    obj.select_set(True)

            if not bpy.context.selected_objects:
                return True

            bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]

            # Enter edit mode
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')

            # Perform UV unwrapping based on method
            if method == 'smart':
                bpy.ops.uv.smart_project(island_margin=0.02)
            elif method == 'cube':
                bpy.ops.uv.cube_project()
            elif method == 'sphere':
                bpy.ops.uv.sphere_project()
            elif method == 'cylinder':
                bpy.ops.uv.cylinder_project()
            else:
                # Default to smart project
                bpy.ops.uv.smart_project(island_margin=0.02)

            # Back to object mode
            bpy.ops.object.mode_set(mode='OBJECT')

            return True
        except Exception as e:
            print(f"Error unwrapping UVs: {e}", file=sys.stderr)
            return False

    def clear_scene(self):
        """Clear all objects from scene"""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()


def main():
    """CLI entry point for Blender automation scripts"""
    if len(sys.argv) < 2:
        print("Usage: blender --background --python automation.py -- <command> [args...]",
              file=sys.stderr)
        sys.exit(1)

    # Arguments after '--' are passed to script
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]

    command = args[0]
    automation = BlenderAutomation(headless=True)

    if command == 'import_export':
        # Import file and export to multiple formats
        input_file = args[1]
        output_dir = args[2]
        formats = args[3].split(',') if len(args) > 3 else ['obj', 'fbx']

        # Import file
        if input_file.endswith('.obj'):
            automation.import_obj(input_file)
        elif input_file.endswith('.fbx'):
            automation.import_fbx(input_file)

        # Clean up mesh
        automation.cleanup_mesh()

        # Export to requested formats
        base_name = Path(input_file).stem
        for fmt in formats:
            output_path = os.path.join(output_dir, f"{base_name}.{fmt}")
            if fmt == 'obj':
                automation.export_obj(output_path)
            elif fmt == 'fbx':
                automation.export_fbx(output_path)
            elif fmt in ['gltf', 'glb']:
                automation.export_gltf(output_path)
            elif fmt == 'dae':
                automation.export_dae(output_path)

        # Get stats
        stats = automation.get_mesh_stats()
        print(json.dumps(stats))

    elif command == 'cleanup':
        # Clean up mesh file
        input_file = args[1]
        output_file = args[2]

        # Import
        if input_file.endswith('.obj'):
            automation.import_obj(input_file)
        elif input_file.endswith('.fbx'):
            automation.import_fbx(input_file)

        # Cleanup
        automation.cleanup_mesh()
        automation.unwrap_uvs(method='smart')

        # Export
        if output_file.endswith('.obj'):
            automation.export_obj(output_file)
        elif output_file.endswith('.fbx'):
            automation.export_fbx(output_file)

        # Stats
        stats = automation.get_mesh_stats()
        print(json.dumps(stats))

    elif command == 'stats':
        # Get stats for mesh file
        input_file = args[1]

        if input_file.endswith('.obj'):
            automation.import_obj(input_file)
        elif input_file.endswith('.fbx'):
            automation.import_fbx(input_file)

        stats = automation.get_mesh_stats()
        print(json.dumps(stats))

    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
