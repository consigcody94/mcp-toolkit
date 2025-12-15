"""
Mesh Optimizer - Polygon reduction and optimization
Handles decimation, retopology, and mesh simplification
"""

import bpy
import sys
from typing import Optional


class MeshOptimizer:
    """
    Mesh optimization and polygon reduction
    """

    def __init__(self):
        pass

    def decimate(
        self,
        target_poly_count: int,
        preserve_uvs: bool = True,
        preserve_sharp_edges: bool = True
    ) -> bool:
        """
        Reduce polygon count using decimation modifier

        Args:
            target_poly_count: Target number of polygons
            preserve_uvs: Preserve UV mapping during decimation
            preserve_sharp_edges: Preserve hard edges

        Returns:
            Success status
        """
        try:
            # Get all mesh objects
            mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']

            if not mesh_objects:
                print("No mesh objects found", file=sys.stderr)
                return False

            for obj in mesh_objects:
                # Get current poly count
                current_poly_count = len(obj.data.polygons)

                if current_poly_count <= target_poly_count:
                    continue  # Already below target

                # Calculate ratio
                ratio = target_poly_count / current_poly_count

                # Add decimate modifier
                modifier = obj.modifiers.new(name="Decimate", type='DECIMATE')
                modifier.ratio = ratio
                modifier.use_collapse_triangulate = True

                # Preserve UVs if requested
                if preserve_uvs and obj.data.uv_layers:
                    modifier.delimit = {'UV'}

                # Apply modifier
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.modifier_apply(modifier=modifier.name)

            return True

        except Exception as e:
            print(f"Error decimating mesh: {e}", file=sys.stderr)
            return False

    def optimize_for_platform(
        self,
        platform: str,
        quality_preset: str = 'balanced'
    ) -> bool:
        """
        Optimize mesh for specific platform

        Args:
            platform: Target platform ('vrchat_pc', 'vrchat_quest', 'imvu', 'secondlife')
            quality_preset: Quality preset ('fast', 'balanced', 'quality')

        Returns:
            Success status
        """
        # Platform-specific poly count limits
        limits = {
            'vrchat_pc': {'fast': 20000, 'balanced': 50000, 'quality': 70000},
            'vrchat_quest': {'fast': 5000, 'balanced': 10000, 'quality': 20000},
            'imvu': {'fast': 10000, 'balanced': 20000, 'quality': 35000},
            'secondlife': {'fast': 10000, 'balanced': 32000, 'quality': 65000},
        }

        if platform not in limits:
            print(f"Unknown platform: {platform}", file=sys.stderr)
            return False

        target_poly_count = limits[platform].get(quality_preset, limits[platform]['balanced'])

        return self.decimate(
            target_poly_count=target_poly_count,
            preserve_uvs=True,
            preserve_sharp_edges=(quality_preset != 'fast')
        )

    def remove_internal_geometry(self) -> bool:
        """
        Remove internal faces that aren't visible

        Returns:
            Success status
        """
        try:
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                bpy.context.view_layer.objects.active = obj
                obj.select_set(True)

                # Enter edit mode
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')

                # Select internal faces
                bpy.ops.mesh.select_interior_faces()

                # Delete selected
                bpy.ops.mesh.delete(type='FACE')

                # Back to object mode
                bpy.ops.object.mode_set(mode='OBJECT')
                obj.select_set(False)

            return True

        except Exception as e:
            print(f"Error removing internal geometry: {e}", file=sys.stderr)
            return False

    def triangulate(self, quad_method: str = 'BEAUTY') -> bool:
        """
        Convert all faces to triangles

        Args:
            quad_method: Quad triangulation method ('BEAUTY', 'FIXED', 'ALTERNATE', 'SHORT_EDGE', 'LONG_EDGE')

        Returns:
            Success status
        """
        try:
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                bpy.context.view_layer.objects.active = obj
                obj.select_set(True)

                # Enter edit mode
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')

                # Triangulate
                bpy.ops.mesh.quads_convert_to_tris(quad_method=quad_method)

                # Back to object mode
                bpy.ops.object.mode_set(mode='OBJECT')
                obj.select_set(False)

            return True

        except Exception as e:
            print(f"Error triangulating mesh: {e}", file=sys.stderr)
            return False

    def smooth_shading(self, auto_smooth: bool = True, angle: float = 30.0) -> bool:
        """
        Apply smooth shading to mesh

        Args:
            auto_smooth: Use auto smooth
            angle: Auto smooth angle in degrees

        Returns:
            Success status
        """
        try:
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                # Select object
                bpy.context.view_layer.objects.active = obj
                obj.select_set(True)

                # Apply smooth shading
                bpy.ops.object.shade_smooth()

                # Auto smooth
                if auto_smooth:
                    obj.data.use_auto_smooth = True
                    obj.data.auto_smooth_angle = angle * (3.14159 / 180.0)  # Convert to radians

                obj.select_set(False)

            return True

        except Exception as e:
            print(f"Error applying smooth shading: {e}", file=sys.stderr)
            return False
