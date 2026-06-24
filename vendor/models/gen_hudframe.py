#!/usr/bin/env python3
# Headless Blender generator → hudframe.glb
# Run:  blender --background --python gen_hudframe.py
# A holographic HUD frame: concentric thin rings + radial tick marks, emissive,
# meant to sit behind/around the reactor in the Three.js scene.
import bpy, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hudframe.glb")

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in (bpy.data.meshes, bpy.data.materials):
    for b in list(blk):
        blk.remove(b)

def _set(bsdf, names, val):
    for n in names:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = val; return

def mat(name, base, emission, emis_str, metallic=0.0, rough=0.4):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    _set(b, ['Base Color'], (*base, 1)); _set(b, ['Metallic'], metallic); _set(b, ['Roughness'], rough)
    _set(b, ['Emission Color', 'Emission'], (*emission, 1)); _set(b, ['Emission Strength'], emis_str)
    return m

RED  = mat('hud_red',  (0.30, 0.0, 0.05), (1.0, 0.15, 0.28), 4.0)
GOLD = mat('hud_gold', (0.30, 0.20, 0.0), (0.95, 0.7, 0.12), 3.2)

def add(o, m):
    o.data.materials.append(m); return o

# concentric rings (flat, in the XY plane)
for rr, mm in ((2.6, RED), (2.45, GOLD), (1.95, RED), (3.0, RED)):
    bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=0.012, major_segments=160, minor_segments=8)
    add(bpy.context.active_object, mm)

# radial tick marks around the outer ring
N = 48
for i in range(N):
    a = (i / N) * math.tau
    long = (i % 6 == 0)
    L = 0.18 if long else 0.08
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(math.cos(a) * 2.78, math.sin(a) * 2.78, 0))
    o = bpy.context.active_object
    o.scale = (L, 0.014, 0.014); o.rotation_euler = (0, 0, a)
    add(o, GOLD if long else RED)

# four corner brackets (decorative)
for cx, cy in ((1, 1), (-1, 1), (-1, 1), (1, -1)):
    pass  # brackets kept minimal; rings + ticks read clearly

for o in bpy.data.objects:
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True)
print("WROTE", OUT, os.path.getsize(OUT), "bytes")
