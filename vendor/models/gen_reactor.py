#!/usr/bin/env python3
# Headless Blender generator → reactor.glb
# Run:  blender --background --python gen_reactor.py
# Builds a JARVIS arc-reactor: dark-chrome housing, gold accent rings, copper
# coils, an emissive red core and a glass dome. Exports PBR GLB for Three.js.
import bpy, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reactor.glb")

# ── clean slate ──
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for blk in (bpy.data.meshes, bpy.data.materials):
    for b in list(blk):
        blk.remove(b)

def _set(bsdf, names, val):
    for n in names:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = val
            return

def mat(name, base, metallic=0.0, rough=0.5, emission=None, emis_str=0.0, transmission=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    _set(b, ['Base Color'], (*base, 1))
    _set(b, ['Metallic'], metallic)
    _set(b, ['Roughness'], rough)
    _set(b, ['Transmission Weight', 'Transmission'], transmission)
    if emission:
        _set(b, ['Emission Color', 'Emission'], (*emission, 1))
        _set(b, ['Emission Strength'], emis_str)
    return m

CHROME = mat('chrome', (0.10, 0.10, 0.12), metallic=1.0, rough=0.16)
GOLD   = mat('gold',   (0.72, 0.52, 0.10), metallic=1.0, rough=0.22)
COPPER = mat('copper', (0.55, 0.22, 0.10), metallic=1.0, rough=0.30)
COREM  = mat('core',   (0.30, 0.0, 0.04),  metallic=0.2, rough=0.4, emission=(1.0, 0.12, 0.22), emis_str=6.0)
GLASS  = mat('glass',  (1.0, 1.0, 1.0),    metallic=0.0, rough=0.03, transmission=1.0)

def add(obj, m):
    obj.data.materials.append(m)
    return obj

# outer housing (beveled torus)
bpy.ops.mesh.primitive_torus_add(major_radius=1.4, minor_radius=0.20, major_segments=96, minor_segments=24)
add(bpy.context.active_object, CHROME)
# gold accent rings
for rr in (1.15, 0.78):
    bpy.ops.mesh.primitive_torus_add(major_radius=rr, minor_radius=0.045, major_segments=96, minor_segments=16)
    add(bpy.context.active_object, GOLD)
# copper coils around the inner ring
N = 10
for i in range(N):
    a = (i / N) * math.tau
    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.34, vertices=12,
                                        location=(math.cos(a) * 0.98, math.sin(a) * 0.98, 0))
    o = bpy.context.active_object
    o.rotation_euler = (math.pi / 2, 0, a)
    add(o, COPPER)
# core housing (short cylinder) + emissive core + glass dome
bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=0.22, vertices=64)
add(bpy.context.active_object, CHROME)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.42, segments=48, ring_count=32)
core = bpy.context.active_object; add(core, COREM)
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.6, segments=48, ring_count=32)
dome = bpy.context.active_object; add(dome, GLASS)
bpy.ops.object.shade_smooth()

# smooth-shade the rings/housing too
for o in bpy.data.objects:
    if o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True, export_yup=True)
print("WROTE", OUT, os.path.getsize(OUT), "bytes")
