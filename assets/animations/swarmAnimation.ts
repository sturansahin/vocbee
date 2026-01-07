/**
 * Swarm (Bee) Lottie Animation Data
 * Converted from JSON for better type safety and dynamic color support
 */

// Helper function to create animation data with custom color
// static: if true, wings don't animate (for initial display)
export const createSwarmAnimation = (
    color: [number, number, number, number] = [0.29, 0.87, 0.5, 1],
    isStatic: boolean = false
) => ({
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 12,
    w: 260,
    h: 240,
    nm: "swarm_from_svg",
    ddd: 0,
    assets: [],
    layers: [
        // Layer 1: m12 (wing - animated rotation)
        {
            ddd: 0,
            ind: 1,
            ty: 4,
            nm: "m12",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: isStatic
                    ? { a: 0, k: 0 }  // Static: no rotation
                    : {
                        a: 1,
                        k: [
                            { t: 0, s: [-26], e: [28], o: { x: [0.42], y: [0.0] }, i: { x: [0.58], y: [1.0] } },
                            { t: 6, s: [28], e: [-26], o: { x: [0.42], y: [0.0] }, i: { x: [0.58], y: [1.0] } },
                            { t: 12, s: [-26] }
                        ]
                    },
                p: { a: 0, k: [120.545948, 69.35360604444443, 0] },
                a: { a: 0, k: [120.545948, 69.35360604444443, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                {
                    ty: "gr",
                    nm: "Group 1",
                    it: [
                        {
                            ty: "sh",
                            nm: "Path 1",
                            ks: {
                                a: 0,
                                k: {
                                    i: [[0.123, -0.073], [46.23, -61.64], [-44.49, -2.78], [-2.68, 0.0], [-13.84, 8.71]],
                                    o: [[0.0, 0.0], [-26.04, 34.74], [2.28, 0.21], [17.56, 0.0], [-0.123, 0.073]],
                                    v: [[126.52, 88.1], [7.64, 44.07], [71.48, 101.31], [79.1, 101.63], [126.89, 87.88]],
                                    c: true
                                }
                            }
                        },
                        { ty: "fl", nm: "Fill 1", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
                        {
                            ty: "tr",
                            nm: "Transform",
                            p: { a: 0, k: [0, 0] },
                            a: { a: 0, k: [0, 0] },
                            s: { a: 0, k: [100, 100] },
                            r: { a: 0, k: 0 },
                            o: { a: 0, k: 100 },
                            sk: { a: 0, k: 0 },
                            sa: { a: 0, k: 0 }
                        }
                    ]
                }
            ],
            ip: 0,
            op: 12,
            st: 0,
            bm: 0
        },
        // Layer 2: shape_1 (body)
        {
            ddd: 0,
            ind: 2,
            ty: 4,
            nm: "shape_1",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [0, 0, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                {
                    ty: "gr",
                    nm: "Group 1",
                    it: [
                        {
                            ty: "sh",
                            nm: "Path 1",
                            ks: {
                                a: 0,
                                k: {
                                    i: [[0.003, 0.0], [-6.94, 16.14], [0.0, -32.02], [-0.01, -0.54], [0.0, 0.027], [-36.99, 0.0], [-11.82, 14.12], [-0.027, 0.033], [14.29, 33.68]],
                                    o: [[-10.65, -25.08], [-29.62, 9.0], [0.0, 0.55], [0.0, -0.027], [0.0, 39.62], [19.84, -0.13], [0.027, -0.033], [-20.18, 3.78], [-0.003, 0.0]],
                                    v: [[165.63, 165.0], [160.57, 98.6], [109.77, 166.68], [109.79, 168.32], [109.79, 168.24], [176.76, 239.98], [226.12, 216.72], [226.2, 216.62], [165.64, 165.0]],
                                    c: true
                                }
                            }
                        },
                        { ty: "fl", nm: "Fill 1", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
                        {
                            ty: "tr",
                            nm: "Transform",
                            p: { a: 0, k: [0, 0] },
                            a: { a: 0, k: [0, 0] },
                            s: { a: 0, k: [100, 100] },
                            r: { a: 0, k: 0 },
                            o: { a: 0, k: 100 },
                            sk: { a: 0, k: 0 },
                            sa: { a: 0, k: 0 }
                        }
                    ]
                }
            ],
            ip: 0,
            op: 12,
            st: 0,
            bm: 0
        },
        // Layer 3: shape_2 (stinger)
        {
            ddd: 0,
            ind: 3,
            ty: 4,
            nm: "shape_2",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [0, 0, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                {
                    ty: "gr",
                    nm: "Group 1",
                    it: [
                        {
                            ty: "sh",
                            nm: "Path 1",
                            ks: {
                                a: 0,
                                k: {
                                    i: [[0.003, 0.0], [-4.79, -14.36], [0.0, 0.0], [6.23, 11.52], [0.21, 0.427], [3.03, 14.82], [0.11, 0.643]],
                                    o: [[0.0, 0.0], [4.79, 14.36], [-7.53, -9.73], [-0.21, -0.427], [-4.47, -11.87], [-0.11, -0.643], [-0.003, 0.0]],
                                    v: [[83.47, 158.69], [57.17, 211.31], [116.96, 235.22], [96.07, 203.02], [95.44, 201.74], [83.81, 160.62], [83.48, 158.69]],
                                    c: true
                                }
                            }
                        },
                        { ty: "fl", nm: "Fill 1", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
                        {
                            ty: "tr",
                            nm: "Transform",
                            p: { a: 0, k: [0, 0] },
                            a: { a: 0, k: [0, 0] },
                            s: { a: 0, k: [100, 100] },
                            r: { a: 0, k: 0 },
                            o: { a: 0, k: 100 },
                            sk: { a: 0, k: 0 },
                            sa: { a: 0, k: 0 }
                        }
                    ]
                }
            ],
            ip: 0,
            op: 12,
            st: 0,
            bm: 0
        },
        // Layer 4: m17 (wing 2 - animated rotation)
        {
            ddd: 0,
            ind: 4,
            ty: 4,
            nm: "m17",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: isStatic
                    ? { a: 0, k: 0 }  // Static: no rotation
                    : {
                        a: 1,
                        k: [
                            { t: 0, s: [40], e: [-42], o: { x: [0.42], y: [0.0] }, i: { x: [0.58], y: [1.0] } },
                            { t: 6, s: [-42], e: [40], o: { x: [0.42], y: [0.0] }, i: { x: [0.58], y: [1.0] } },
                            { t: 12, s: [40] }
                        ]
                    },
                p: { a: 0, k: [138.632, 66.19907679999997, 0] },
                a: { a: 0, k: [138.632, 66.19907679999997, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                {
                    ty: "gr",
                    nm: "Group 1",
                    it: [
                        {
                            ty: "sh",
                            nm: "Path 1",
                            ks: {
                                a: 0,
                                k: {
                                    i: [[-10.3, -5.95], [10.57, -18.3], [10.3, 5.95], [-10.57, 18.3]],
                                    o: [[10.3, 5.94], [-10.57, 18.3], [-10.3, -5.94], [10.57, -18.3]],
                                    v: [[179.14, 10.76], [178.65, 54.66], [140.87, 77.03], [141.36, 33.13]],
                                    c: true
                                }
                            }
                        },
                        { ty: "fl", nm: "Fill 1", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
                        {
                            ty: "tr",
                            nm: "Transform",
                            p: { a: 0, k: [0, 0] },
                            a: { a: 0, k: [0, 0] },
                            s: { a: 0, k: [100, 100] },
                            r: { a: 0, k: 0 },
                            o: { a: 0, k: 100 },
                            sk: { a: 0, k: 0 },
                            sa: { a: 0, k: 0 }
                        }
                    ]
                }
            ],
            ip: 0,
            op: 12,
            st: 0,
            bm: 0
        },
        // Layer 5: shape_3 (body part)
        {
            ddd: 0,
            ind: 5,
            ty: 4,
            nm: "shape_3",
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [0, 0, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                {
                    ty: "gr",
                    nm: "Group 1",
                    it: [
                        {
                            ty: "sh",
                            nm: "Path 1",
                            ks: {
                                a: 0,
                                k: {
                                    i: [[-11.28, -25.34], [14.48, -6.44], [11.28, 25.34], [-14.48, 6.44]],
                                    o: [[11.28, 25.34], [-14.48, 6.44], [-11.28, -25.34], [14.48, -6.44]],
                                    v: [[241.23, 135.07], [235.44, 192.62], [188.8, 158.41], [194.59, 100.86]],
                                    c: true
                                }
                            }
                        },
                        { ty: "fl", nm: "Fill 1", c: { a: 0, k: color }, o: { a: 0, k: 100 }, r: 1 },
                        {
                            ty: "tr",
                            nm: "Transform",
                            p: { a: 0, k: [0, 0] },
                            a: { a: 0, k: [0, 0] },
                            s: { a: 0, k: [100, 100] },
                            r: { a: 0, k: 0 },
                            o: { a: 0, k: 100 },
                            sk: { a: 0, k: 0 },
                            sa: { a: 0, k: 0 }
                        }
                    ]
                }
            ],
            ip: 0,
            op: 12,
            st: 0,
            bm: 0
        }
    ]
});

// Default green color animation (for static import compatibility)
export const swarmAnimationGreen = createSwarmAnimation([0.29, 0.87, 0.5, 1]);

// White color for light mode
export const swarmAnimationWhite = createSwarmAnimation([1, 1, 1, 1]);

// Default export
export default swarmAnimationGreen;
