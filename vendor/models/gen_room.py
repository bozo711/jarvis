#!/usr/bin/env python3
# Headless Blender generator → room.glb
# Run:  blender --background --python gen_room.py
# A subtle sci-fi platform: a beveled hexagonal floor pad + a low surrounding
# ring rail. Grounds the reactor; the HDRI does the lighting.
import bpy, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "room.glb")

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in (bpy.data.meshes, bpy.data.materials):
    for b in list(blk):
        blk.remove(b)

def _set(bsdf, names, val):
    for n in names:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = val; return

def mat(name, base, metallic, rough, emission=None, emis_str=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    _set(b, ['Base Color'], (*base, 1)); _set(b, ['Metallic'], metallic); _set(b, ['Roughness'], rough)
    if emission:
        _set(b, ['Emission Color', 'Emission'], (*emission, 1)); _set(b, ['Emission Strength'], emis_str)
    return m

FLOOR = mat('floor', (0.03, 0.02, 0.04), 0.7, 0.35)
TRIM  = mat('trim',  (0.20, 0.0, 0.04), 0.2, 0.4, emission=(1.0, 0.15, 0.28), emis_str=2.2)

def add(o, m):
    o.data.materials.append(m); return o

# hexagonal floor pad (cylinder with 6 verts), beveled, lying flat
bpy.ops.mesh.primitive_cylinder_add(radius=7.0, depth=0.5, vertices=6, location=(0, 0, -2.5))
floor = bpy.context.active_object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bevel(offset=0.12, segments=2); bpy.ops.object.mode_set(mode='OBJECT')
add(floor, FLOOR)

# glowing trim ring around the pad
bpy.ops.mesh.primitive_torus_add(major_radius=6.2, minor_radius=0.05, major_segments=128, minor_segments=10, location=(0, 0, -2.24))
add(bpy.context.active_object, TRIM)

for o in bpy.data.objects:
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True)
print("WROTE", OUT, os.path.getsize(OUT), "bytes")
