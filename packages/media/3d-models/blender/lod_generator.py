"""
LOD Generator - Level of Detail generation
Creates multiple quality levels for distance-based rendering
"""

import bpy
import sys
import os
from pathlib import Path
from typing import List, Dict


class LODGenerator:
    """
    Generate Level of Detail (LOD) meshes
    Creates progressively simplified versions for performance
    """

    def __init__(self):
        self.lod_ratios = {
            'lod0': 1.0,      # Original (100%)
            'lod1': 0.6,      # High (60%)
            'lod2': 0.35,     # Medium (35%)
            'lod3': 0.15,     # Low (15%)
            'lod4': 0.05,     # Very Low (5%)
        }

    def generate_lods(
        self,
        num_levels: int = 5,
        custom_ratios: List[float] = None
    ) -> Dict[str, int]:
        """
        Generate multiple LOD levels

        Args:
            num_levels: Number of LOD levels to generate (1-5)
            custom_ratios: Custom reduction ratios (optional)

        Returns:
            Dictionary mapping LOD level to polygon count
        """
        try:
            # Get original mesh
            mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']

            if not mesh_objects:
                print("No mesh objects found", file=sys.stderr)
                return {}

            # Use first mesh as base
            base_mesh = mesh_objects[0]
            original_poly_count = len(base_mesh.data.polygons)

            # Determine ratios to use
            if custom_ratios:
                ratios = custom_ratios[:num_levels]
            else:
                ratio_list = list(self.lod_ratios.values())
                ratios = ratio_list[:num_levels]

            lod_stats = {}

            # Generate each LOD level
            for i, ratio in enumerate(ratios):
                lod_name = f"lod{i}"

                # Duplicate base mesh
                bpy.ops.object.select_all(action='DESELECT')
                base_mesh.select_set(True)
                bpy.context.view_layer.objects.active = base_mesh
                bpy.ops.object.duplicate()
                lod_mesh = bpy.context.active_object
                lod_mesh.name = f"{base_mesh.name}_{lod_name}"

                # Apply decimation if not LOD0
                if ratio < 1.0:
                    modifier = lod_mesh.modifiers.new(name="Decimate", type='DECIMATE')
                    modifier.ratio = ratio
                    modifier.use_collapse_triangulate = True

                    # Apply modifier
                    bpy.context.view_layer.objects.active = lod_mesh
                    bpy.ops.object.modifier_apply(modifier=modifier.name)

                # Record stats
                lod_poly_count = len(lod_mesh.data.polygons)
                lod_stats[lod_name] = lod_poly_count

                print(f"Generated {lod_name}: {lod_poly_count} polygons ({ratio*100:.1f}%)",
                      file=sys.stderr)

            return lod_stats

        except Exception as e:
            print(f"Error generating LODs: {e}", file=sys.stderr)
            return {}

    def export_lods(
        self,
        output_dir: str,
        base_name: str,
        export_format: str = 'obj'
    ) -> List[str]:
        """
        Export all LOD levels to files

        Args:
            output_dir: Output directory path
            base_name: Base filename (without extension)
            export_format: Export format ('obj', 'fbx', 'gltf')

        Returns:
            List of exported file paths
        """
        try:
            # Ensure output directory exists
            Path(output_dir).mkdir(parents=True, exist_ok=True)

            exported_files = []

            # Export each LOD mesh
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                # Check if this is a LOD mesh
                if '_lod' not in obj.name:
                    continue

                # Extract LOD level from name
                lod_suffix = obj.name.split('_lod')[-1]
                filename = f"{base_name}_lod{lod_suffix}.{export_format}"
                filepath = os.path.join(output_dir, filename)

                # Select only this object
                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj

                # Export based on format
                if export_format == 'obj':
                    bpy.ops.export_scene.obj(
                        filepath=filepath,
                        use_selection=True,
                        use_materials=True,
                        use_normals=True,
                        use_uvs=True,
                    )
                elif export_format == 'fbx':
                    bpy.ops.export_scene.fbx(
                        filepath=filepath,
                        use_selection=True,
                        use_mesh_modifiers=True,
                    )
                elif export_format == 'gltf' or export_format == 'glb':
                    bpy.ops.export_scene.gltf(
                        filepath=filepath,
                        use_selection=True,
                        export_format='GLB' if export_format == 'glb' else 'GLTF_SEPARATE',
                    )

                exported_files.append(filepath)
                print(f"Exported: {filepath}", file=sys.stderr)

            return exported_files

        except Exception as e:
            print(f"Error exporting LODs: {e}", file=sys.stderr)
            return []

    def generate_secondlife_lods(self) -> Dict[str, int]:
        """
        Generate LODs specifically for Second Life
        Second Life requires 4 LOD levels with specific ratios

        Returns:
            Dictionary mapping LOD level to polygon count
        """
        # Second Life LOD ratios
        sl_ratios = [
            1.0,    # High LOD
            0.5,    # Medium LOD
            0.25,   # Low LOD
            0.125   # Lowest LOD
        ]

        return self.generate_lods(num_levels=4, custom_ratios=sl_ratios)

    def calculate_land_impact(self) -> Dict[str, float]:
        """
        Calculate Second Life land impact metrics

        Returns:
            Dictionary with land impact calculations
        """
        mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']

        if not mesh_objects:
            return {}

        # Get polygon counts for each LOD
        lod_counts = {}
        for obj in mesh_objects:
            if '_lod' in obj.name:
                lod_level = obj.name.split('_lod')[-1]
                lod_counts[f"lod{lod_level}"] = len(obj.data.polygons)

        # Calculate download weight (simplified formula)
        # Real SL formula is more complex and includes texture data
        download_weight = sum(count * 0.06 for count in lod_counts.values()) / len(lod_counts)

        # Physics weight (assumes convex hull decomposition)
        physics_weight = lod_counts.get('lod3', 0) * 0.04

        # Server weight
        server_weight = max(download_weight, physics_weight)

        # Estimated land impact (simplified)
        land_impact = max(server_weight, 1.0)

        return {
            'download_weight': round(download_weight, 2),
            'physics_weight': round(physics_weight, 2),
            'server_weight': round(server_weight, 2),
            'estimated_land_impact': round(land_impact, 1),
            'lod_counts': lod_counts,
        }
