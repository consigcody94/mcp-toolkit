"""
Texture Baker - PBR texture generation and baking
Handles diffuse, normal, roughness, metallic texture baking
"""

import bpy
import sys
import os
from pathlib import Path
from typing import Dict, Tuple, Optional


class TextureBaker:
    """
    Bake PBR textures from 3D models
    Generates diffuse, normal, roughness, and metallic maps
    """

    def __init__(self):
        self.supported_resolutions = [512, 1024, 2048, 4096, 8192]

    def setup_bake_material(
        self,
        obj: bpy.types.Object,
        resolution: int = 2048
    ) -> Optional[bpy.types.Image]:
        """
        Setup material and image for baking

        Args:
            obj: Blender object to setup
            resolution: Texture resolution

        Returns:
            Created image object
        """
        try:
            # Create new material if needed
            if not obj.data.materials:
                mat = bpy.data.materials.new(name="BakeMaterial")
                obj.data.materials.append(mat)
            else:
                mat = obj.data.materials[0]

            # Enable nodes
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            nodes.clear()

            # Create image texture node
            tex_node = nodes.new('ShaderNodeTexImage')

            # Create new image
            image_name = f"{obj.name}_baked"
            image = bpy.data.images.new(
                name=image_name,
                width=resolution,
                height=resolution,
                alpha=True
            )

            tex_node.image = image
            tex_node.select = True
            nodes.active = tex_node

            return image

        except Exception as e:
            print(f"Error setting up bake material: {e}", file=sys.stderr)
            return None

    def bake_diffuse(
        self,
        resolution: int = 2048,
        samples: int = 32
    ) -> bool:
        """
        Bake diffuse color texture

        Args:
            resolution: Texture resolution (512, 1024, 2048, 4096)
            samples: Number of samples for baking

        Returns:
            Success status
        """
        try:
            # Setup bake settings
            bpy.context.scene.render.engine = 'CYCLES'
            bpy.context.scene.cycles.samples = samples
            bpy.context.scene.cycles.bake_type = 'DIFFUSE'
            bpy.context.scene.render.bake.use_pass_direct = False
            bpy.context.scene.render.bake.use_pass_indirect = False
            bpy.context.scene.render.bake.use_pass_color = True

            # Bake for each mesh object
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                # Setup material
                image = self.setup_bake_material(obj, resolution)
                if not image:
                    continue

                # Select object
                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj

                # Bake
                bpy.ops.object.bake(type='DIFFUSE')

            return True

        except Exception as e:
            print(f"Error baking diffuse: {e}", file=sys.stderr)
            return False

    def bake_normal(
        self,
        resolution: int = 2048,
        samples: int = 32
    ) -> bool:
        """
        Bake normal map texture

        Args:
            resolution: Texture resolution
            samples: Number of samples

        Returns:
            Success status
        """
        try:
            # Setup bake settings
            bpy.context.scene.render.engine = 'CYCLES'
            bpy.context.scene.cycles.samples = samples
            bpy.context.scene.cycles.bake_type = 'NORMAL'

            # Bake for each mesh
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                image = self.setup_bake_material(obj, resolution)
                if not image:
                    continue

                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj

                bpy.ops.object.bake(type='NORMAL')

            return True

        except Exception as e:
            print(f"Error baking normal: {e}", file=sys.stderr)
            return False

    def bake_roughness(
        self,
        resolution: int = 2048,
        samples: int = 32
    ) -> bool:
        """
        Bake roughness texture

        Args:
            resolution: Texture resolution
            samples: Number of samples

        Returns:
            Success status
        """
        try:
            bpy.context.scene.render.engine = 'CYCLES'
            bpy.context.scene.cycles.samples = samples
            bpy.context.scene.cycles.bake_type = 'ROUGHNESS'

            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                image = self.setup_bake_material(obj, resolution)
                if not image:
                    continue

                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj

                bpy.ops.object.bake(type='ROUGHNESS')

            return True

        except Exception as e:
            print(f"Error baking roughness: {e}", file=sys.stderr)
            return False

    def bake_pbr_set(
        self,
        output_dir: str,
        base_name: str,
        resolution: int = 2048,
        samples: int = 64
    ) -> Dict[str, str]:
        """
        Bake complete PBR texture set

        Args:
            output_dir: Output directory for textures
            base_name: Base name for texture files
            resolution: Texture resolution
            samples: Number of samples for baking

        Returns:
            Dictionary mapping texture type to file path
        """
        try:
            # Ensure output directory exists
            Path(output_dir).mkdir(parents=True, exist_ok=True)

            texture_paths = {}

            # Bake diffuse/albedo
            print("Baking diffuse...", file=sys.stderr)
            if self.bake_diffuse(resolution, samples):
                path = self._save_baked_images(output_dir, base_name, 'diffuse')
                texture_paths['diffuse'] = path

            # Bake normal
            print("Baking normal...", file=sys.stderr)
            if self.bake_normal(resolution, samples):
                path = self._save_baked_images(output_dir, base_name, 'normal')
                texture_paths['normal'] = path

            # Bake roughness
            print("Baking roughness...", file=sys.stderr)
            if self.bake_roughness(resolution, samples):
                path = self._save_baked_images(output_dir, base_name, 'roughness')
                texture_paths['roughness'] = path

            return texture_paths

        except Exception as e:
            print(f"Error baking PBR set: {e}", file=sys.stderr)
            return {}

    def _save_baked_images(
        self,
        output_dir: str,
        base_name: str,
        texture_type: str
    ) -> str:
        """
        Save baked images to files

        Args:
            output_dir: Output directory
            base_name: Base filename
            texture_type: Type of texture (diffuse, normal, roughness, etc.)

        Returns:
            Path to saved file
        """
        # Find baked images
        for image in bpy.data.images:
            if '_baked' in image.name:
                # Set file format
                image.file_format = 'PNG'

                # Save path
                filename = f"{base_name}_{texture_type}.png"
                filepath = os.path.join(output_dir, filename)

                # Save image
                image.filepath_raw = filepath
                image.save()

                print(f"Saved {texture_type} texture: {filepath}", file=sys.stderr)
                return filepath

        return ""

    def generate_procedural_pbr(
        self,
        material_type: str = 'metal',
        base_color: Tuple[float, float, float] = (0.8, 0.8, 0.8),
        roughness: float = 0.5,
        metallic: float = 0.0
    ) -> bool:
        """
        Generate procedural PBR material

        Args:
            material_type: Type of material ('metal', 'plastic', 'wood', 'fabric')
            base_color: RGB base color (0-1 range)
            roughness: Roughness value (0-1)
            metallic: Metallic value (0-1)

        Returns:
            Success status
        """
        try:
            for obj in bpy.context.scene.objects:
                if obj.type != 'MESH':
                    continue

                # Create new material
                mat = bpy.data.materials.new(name=f"PBR_{material_type}")
                mat.use_nodes = True
                nodes = mat.node_tree.nodes
                nodes.clear()

                # Create Principled BSDF node
                bsdf = nodes.new('ShaderNodeBsdfPrincipled')
                bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
                bsdf.inputs['Roughness'].default_value = roughness
                bsdf.inputs['Metallic'].default_value = metallic

                # Material output
                output = nodes.new('ShaderNodeOutputMaterial')

                # Link nodes
                mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

                # Assign material
                if obj.data.materials:
                    obj.data.materials[0] = mat
                else:
                    obj.data.materials.append(mat)

            return True

        except Exception as e:
            print(f"Error generating procedural PBR: {e}", file=sys.stderr)
            return False
