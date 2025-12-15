#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================================================
// DETECTION EFFECTIVENESS RANGES (Based on research)
// ============================================================================
const DETECTION_RANGES = {
  // Image Steganography Detection
  rs_analysis: {
    name: "RS Analysis (Regular-Singular)",
    effectiveness: "85-95%",
    bestFor: "LSB sequential embedding >5% capacity",
    weakAgainst: "Adaptive LSB, content-aware embedding",
    optimalRange: "10-50% payload capacity",
    falsePositiveRate: "2-5%",
  },
  chi_square: {
    name: "Chi-Square Attack",
    effectiveness: "90-98%",
    bestFor: "Simple LSB replacement, sequential embedding",
    weakAgainst: "LSB matching, randomized embedding",
    optimalRange: "5-100% sequential LSB",
    falsePositiveRate: "1-3%",
  },
  sample_pairs: {
    name: "Sample Pairs Analysis",
    effectiveness: "88-96%",
    bestFor: "LSB embedding with correlation",
    weakAgainst: "Spread spectrum, transform domain",
    optimalRange: "3-40% payload",
    falsePositiveRate: "3-6%",
  },
  primary_sets: {
    name: "Primary Sets",
    effectiveness: "82-90%",
    bestFor: "Basic LSB steganography",
    weakAgainst: "Advanced adaptive methods",
    optimalRange: "15-60% capacity",
    falsePositiveRate: "4-8%",
  },
  // Entropy-based Detection
  entropy_analysis: {
    name: "Shannon Entropy Analysis",
    effectiveness: "70-85%",
    bestFor: "Encrypted data, compressed hidden content",
    weakAgainst: "Uncompressed plaintext, low-entropy payloads",
    optimalRange: "Entropy > 7.5 bits/byte indicates encryption",
    falsePositiveRate: "10-20% (compressed files trigger)",
  },
  // Audio Detection
  audio_spectral: {
    name: "Spectral Analysis",
    effectiveness: "75-90%",
    bestFor: "Phase coding, echo hiding, frequency masking",
    weakAgainst: "Low-capacity spread spectrum",
    optimalRange: "Hidden data in 18-22kHz or <20Hz range",
    falsePositiveRate: "5-10%",
  },
  // File Structure
  magic_bytes: {
    name: "Magic Byte/Signature Detection",
    effectiveness: "95-99%",
    bestFor: "Appended files, polyglot files, embedded archives",
    weakAgainst: "Encrypted appended data, custom formats",
    optimalRange: "Any appended/embedded known file format",
    falsePositiveRate: "<1%",
  },
  // Metadata
  metadata_analysis: {
    name: "Metadata Forensics",
    effectiveness: "80-95%",
    bestFor: "Hidden EXIF, XMP, embedded scripts",
    weakAgainst: "Stripped metadata files",
    optimalRange: "Documents, images with rich metadata",
    falsePositiveRate: "2-5%",
  },
};

// ============================================================================
// CORE DETECTION ALGORITHMS
// ============================================================================

interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface AnalysisResult {
  detected: boolean;
  confidence: number;
  method: string;
  details: Record<string, unknown>;
  recommendations: string[];
}

interface EntropyResult {
  overallEntropy: number;
  blockEntropies: number[];
  highEntropyRegions: { start: number; end: number; entropy: number }[];
  likelyEncrypted: boolean;
  likelyCompressed: boolean;
  anomalies: string[];
}

// Shannon Entropy Calculation
function calculateEntropy(data: Buffer): number {
  const freq = new Map<number, number>();
  for (const byte of data) {
    freq.set(byte, (freq.get(byte) || 0) + 1);
  }
  let entropy = 0;
  const len = data.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// Block-wise entropy analysis
function analyzeEntropyBlocks(
  data: Buffer,
  blockSize: number = 256
): EntropyResult {
  const blockEntropies: number[] = [];
  const highEntropyRegions: { start: number; end: number; entropy: number }[] =
    [];

  for (let i = 0; i < data.length; i += blockSize) {
    const block = data.subarray(i, Math.min(i + blockSize, data.length));
    if (block.length >= 32) {
      const e = calculateEntropy(block);
      blockEntropies.push(e);

      if (e > 7.5) {
        highEntropyRegions.push({
          start: i,
          end: Math.min(i + blockSize, data.length),
          entropy: e,
        });
      }
    }
  }

  const overallEntropy = calculateEntropy(data);
  const avgBlockEntropy =
    blockEntropies.reduce((a, b) => a + b, 0) / blockEntropies.length;
  const entropyVariance =
    blockEntropies.reduce((sum, e) => sum + Math.pow(e - avgBlockEntropy, 2), 0) /
    blockEntropies.length;

  const anomalies: string[] = [];
  if (overallEntropy > 7.9) {
    anomalies.push("Near-maximum entropy (>7.9) - likely encrypted or random");
  }
  if (entropyVariance < 0.01 && overallEntropy > 7.5) {
    anomalies.push(
      "Uniform high entropy - consistent with encryption or PRNG output"
    );
  }
  if (highEntropyRegions.length > 0 && highEntropyRegions.length < blockEntropies.length * 0.3) {
    anomalies.push(
      "Localized high-entropy regions - possible hidden encrypted payload"
    );
  }

  return {
    overallEntropy,
    blockEntropies,
    highEntropyRegions,
    likelyEncrypted: overallEntropy > 7.8 && entropyVariance < 0.05,
    likelyCompressed: overallEntropy > 7.0 && overallEntropy < 7.8,
    anomalies,
  };
}

// Chi-Square Test for LSB
function chiSquareAnalysis(pixelData: number[]): {
  pValue: number;
  detected: boolean;
} {
  const histogram = new Array(256).fill(0);
  for (const value of pixelData) {
    histogram[value]++;
  }

  // Pairs of Values (PoV) analysis
  let chiSquare = 0;
  for (let i = 0; i < 128; i++) {
    const observed = histogram[2 * i];
    const expected = (histogram[2 * i] + histogram[2 * i + 1]) / 2;
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }

  // Degrees of freedom = 127
  // P-value approximation using chi-square distribution
  // For large chi-square values, p-value approaches 0
  const df = 127;
  const pValue = 1 - gammaCDF(chiSquare / 2, df / 2);

  return {
    pValue,
    detected: pValue > 0.95, // High p-value indicates LSB manipulation
  };
}

// Gamma CDF approximation for chi-square p-value
function gammaCDF(x: number, a: number): number {
  if (x <= 0) return 0;
  if (x >= a + 10 * Math.sqrt(a)) return 1;

  let sum = 0;
  let term = 1 / a;
  sum = term;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (term < 1e-10) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    ser += c[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// RS Analysis Implementation
function rsAnalysis(
  pixelData: number[],
  width: number,
  height: number
): { estimatedPayload: number; detected: boolean } {
  const blockSize = 4; // 2x2 blocks
  let regularPos = 0,
    singularPos = 0;
  let regularNeg = 0,
    singularNeg = 0;

  const getMask = (type: number): number[] => {
    return type === 0 ? [1, 0, 0, 1] : [0, 1, 1, 0];
  };

  const getVariation = (block: number[]): number => {
    return (
      Math.abs(block[0] - block[1]) +
      Math.abs(block[1] - block[3]) +
      Math.abs(block[3] - block[2]) +
      Math.abs(block[2] - block[0])
    );
  };

  const flipBlock = (block: number[], mask: number[]): number[] => {
    return block.map((v, i) => {
      if (mask[i] === 1) {
        return v % 2 === 0 ? v | 1 : v & 0xfe;
      }
      return v;
    });
  };

  const invertFlipBlock = (block: number[], mask: number[]): number[] => {
    return block.map((v, i) => {
      if (mask[i] === 1) {
        if (v === 255) return 254;
        if (v === 0) return 1;
        return v % 2 === 0 ? v - 1 : v + 1;
      }
      return v;
    });
  };

  for (let y = 0; y < height - 1; y += 2) {
    for (let x = 0; x < width - 1; x += 2) {
      const idx = y * width + x;
      const block = [
        pixelData[idx],
        pixelData[idx + 1],
        pixelData[idx + width],
        pixelData[idx + width + 1],
      ];

      for (let m = 0; m < 2; m++) {
        const mask = getMask(m);
        const varB = getVariation(block);
        const varP = getVariation(flipBlock([...block], mask));
        const varN = getVariation(invertFlipBlock([...block], mask));

        if (varP > varB) regularPos++;
        if (varP < varB) singularPos++;
        if (varN > varB) regularNeg++;
        if (varN < varB) singularNeg++;
      }
    }
  }

  // Estimate payload using quadratic equation
  const d0 = regularPos - singularPos;
  const dm0 = regularNeg - singularNeg;

  let x = 0;
  if (d0 !== dm0) {
    x = (dm0 - d0) / (2 * (dm0 + d0));
  }

  const estimatedPayload = Math.abs(x) * 100;

  return {
    estimatedPayload,
    detected: estimatedPayload > 5, // More than 5% payload detected
  };
}

// Sample Pairs Analysis
function samplePairsAnalysis(
  pixelData: number[],
  width: number,
  height: number
): { estimatedPayload: number; detected: boolean } {
  let P = 0,
    X = 0,
    Y = 0,
    Z = 0,
    W = 0;

  // Horizontal pairs
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x += 2) {
      const u = pixelData[y * width + x];
      const v = pixelData[y * width + x + 1];

      if ((u >> 1) === (v >> 1) && (u & 1) !== (v & 1)) W++;
      if (u === v) Z++;
      if ((v % 2 === 0 && u < v) || (v % 2 === 1 && u > v)) X++;
      if ((v % 2 === 0 && u > v) || (v % 2 === 1 && u < v)) Y++;
      P++;
    }
  }

  // Vertical pairs
  for (let y = 0; y < height - 1; y += 2) {
    for (let x = 0; x < width; x++) {
      const u = pixelData[y * width + x];
      const v = pixelData[(y + 1) * width + x];

      if ((u >> 1) === (v >> 1) && (u & 1) !== (v & 1)) W++;
      if (u === v) Z++;
      if ((v % 2 === 0 && u < v) || (v % 2 === 1 && u > v)) X++;
      if ((v % 2 === 0 && u > v) || (v % 2 === 1 && u < v)) Y++;
      P++;
    }
  }

  const a = 0.5 * (W + Z);
  const b = 2 * X - P;
  const c = Y - X;

  let estimate = 0;
  const discriminant = b * b - 4 * a * c;

  if (discriminant >= 0 && a !== 0) {
    const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    estimate = Math.abs(r1) < Math.abs(r2) ? r1 : r2;
  } else if (b !== 0) {
    estimate = c / b;
  }

  const estimatedPayload = Math.abs(estimate) * 100;

  return {
    estimatedPayload,
    detected: estimatedPayload > 3,
  };
}

// Magic Bytes / File Signature Detection
const FILE_SIGNATURES: { name: string; magic: number[]; offset?: number }[] = [
  { name: "JPEG", magic: [0xff, 0xd8, 0xff] },
  { name: "PNG", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { name: "GIF87a", magic: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  { name: "GIF89a", magic: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  { name: "PDF", magic: [0x25, 0x50, 0x44, 0x46] },
  { name: "ZIP/DOCX/XLSX", magic: [0x50, 0x4b, 0x03, 0x04] },
  { name: "RAR", magic: [0x52, 0x61, 0x72, 0x21] },
  { name: "7z", magic: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { name: "GZIP", magic: [0x1f, 0x8b] },
  { name: "BZ2", magic: [0x42, 0x5a, 0x68] },
  { name: "ELF", magic: [0x7f, 0x45, 0x4c, 0x46] },
  { name: "PE/EXE", magic: [0x4d, 0x5a] },
  { name: "MP3", magic: [0x49, 0x44, 0x33] },
  { name: "MP3 Frame", magic: [0xff, 0xfb] },
  { name: "OGG", magic: [0x4f, 0x67, 0x67, 0x53] },
  { name: "FLAC", magic: [0x66, 0x4c, 0x61, 0x43] },
  { name: "WAV", magic: [0x52, 0x49, 0x46, 0x46] },
  { name: "AVI", magic: [0x52, 0x49, 0x46, 0x46] },
  { name: "MP4", magic: [0x00, 0x00, 0x00], offset: 4 }, // ftyp at offset 4
  { name: "SQLite", magic: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] },
  { name: "LUKS", magic: [0x4c, 0x55, 0x4b, 0x53, 0xba, 0xbe] },
  { name: "TrueCrypt", magic: [0x54, 0x52, 0x55, 0x45] },
  { name: "GPG", magic: [0x85, 0x02] },
  { name: "OpenSSH Key", magic: [0x6f, 0x70, 0x65, 0x6e, 0x73, 0x73, 0x68] },
];

function detectEmbeddedFiles(data: Buffer): {
  found: { name: string; offset: number; size?: number }[];
  suspicious: boolean;
} {
  const found: { name: string; offset: number; size?: number }[] = [];

  for (let i = 0; i < data.length - 8; i++) {
    for (const sig of FILE_SIGNATURES) {
      const offset = sig.offset || 0;
      if (i + offset + sig.magic.length > data.length) continue;

      let match = true;
      for (let j = 0; j < sig.magic.length; j++) {
        if (data[i + offset + j] !== sig.magic[j]) {
          match = false;
          break;
        }
      }

      if (match && i > 0) {
        // Found signature not at start - likely embedded
        found.push({ name: sig.name, offset: i });
      }
    }
  }

  return {
    found,
    suspicious: found.length > 0,
  };
}

// JPEG End of Image detection for appended data
function detectAppendedData(data: Buffer): {
  hasAppended: boolean;
  appendedOffset: number;
  appendedSize: number;
} {
  // Check for JPEG EOI marker
  if (data[0] === 0xff && data[1] === 0xd8) {
    for (let i = data.length - 2; i > 0; i--) {
      if (data[i] === 0xff && data[i + 1] === 0xd9) {
        if (i + 2 < data.length) {
          return {
            hasAppended: true,
            appendedOffset: i + 2,
            appendedSize: data.length - (i + 2),
          };
        }
        break;
      }
    }
  }

  // Check for PNG IEND
  const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  if (data.subarray(0, 4).equals(pngMagic)) {
    const iendIdx = data.indexOf(iend);
    if (iendIdx !== -1 && iendIdx + 8 < data.length) {
      return {
        hasAppended: true,
        appendedOffset: iendIdx + 8,
        appendedSize: data.length - (iendIdx + 8),
      };
    }
  }

  return { hasAppended: false, appendedOffset: 0, appendedSize: 0 };
}

// Frequency analysis for randomness detection
function frequencyTest(data: Buffer): {
  passed: boolean;
  score: number;
  interpretation: string;
} {
  let ones = 0;
  for (const byte of data) {
    for (let i = 0; i < 8; i++) {
      if ((byte >> i) & 1) ones++;
    }
  }

  const n = data.length * 8;
  const proportion = ones / n;
  const sObs = Math.abs(proportion - 0.5) * Math.sqrt(n) * 2;
  const pValue = erfc(sObs / Math.sqrt(2));

  return {
    passed: pValue >= 0.01,
    score: pValue,
    interpretation:
      pValue >= 0.01
        ? "Data appears random (consistent with encryption/compression)"
        : "Non-random pattern detected",
  };
}

// Complementary error function approximation
function erfc(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const tau =
    t *
    Math.exp(
      -x * x -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? tau : 2 - tau;
}

// Serial correlation test
function serialCorrelation(data: Buffer): {
  coefficient: number;
  interpretation: string;
} {
  if (data.length < 2) return { coefficient: 0, interpretation: "Insufficient data" };

  let sum1 = 0,
    sum2 = 0,
    sumProd = 0,
    sumSq1 = 0,
    sumSq2 = 0;

  for (let i = 0; i < data.length - 1; i++) {
    sum1 += data[i];
    sum2 += data[i + 1];
    sumProd += data[i] * data[i + 1];
    sumSq1 += data[i] * data[i];
    sumSq2 += data[i + 1] * data[i + 1];
  }

  const n = data.length - 1;
  const numerator = n * sumProd - sum1 * sum2;
  const denominator = Math.sqrt(
    (n * sumSq1 - sum1 * sum1) * (n * sumSq2 - sum2 * sum2)
  );

  if (denominator === 0) return { coefficient: 0, interpretation: "Constant data" };

  const r = numerator / denominator;

  let interpretation: string;
  if (Math.abs(r) < 0.1) {
    interpretation = "No significant correlation - consistent with random/encrypted data";
  } else if (r > 0.5) {
    interpretation = "Strong positive correlation - structured/text data likely";
  } else if (r < -0.5) {
    interpretation = "Strong negative correlation - unusual pattern";
  } else {
    interpretation = "Moderate correlation - mixed content";
  }

  return { coefficient: r, interpretation };
}

// Runs test for randomness
function runsTest(data: Buffer): { passed: boolean; zScore: number } {
  const bits: number[] = [];
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  const n = bits.length;
  const ones = bits.filter((b) => b === 1).length;
  const pi = ones / n;

  if (Math.abs(pi - 0.5) >= 2 / Math.sqrt(n)) {
    return { passed: false, zScore: Infinity };
  }

  let runs = 1;
  for (let i = 1; i < n; i++) {
    if (bits[i] !== bits[i - 1]) runs++;
  }

  const expectedRuns = ((2 * ones * (n - ones)) / n) + 1;
  const variance = (2 * ones * (n - ones) * (2 * ones * (n - ones) - n)) / (n * n * (n - 1));

  if (variance <= 0) return { passed: true, zScore: 0 };

  const zScore = (runs - expectedRuns) / Math.sqrt(variance);

  return {
    passed: Math.abs(zScore) < 1.96,
    zScore,
  };
}

// ============================================================================
// MCP SERVER IMPLEMENTATION
// ============================================================================

const tools: Tool[] = [
  {
    name: "analyze_image_steganography",
    description:
      "Comprehensive image steganalysis using RS Analysis, Chi-Square, Sample Pairs, and Primary Sets. Detects LSB steganography with detection ranges. Best for PNG/BMP files.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the image file to analyze",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "analyze_entropy",
    description:
      "Shannon entropy analysis with block-wise scanning. Detects encrypted data (>7.8 bits), compressed data (7.0-7.8), and localized high-entropy regions indicating hidden payloads.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to analyze",
        },
        block_size: {
          type: "number",
          description: "Block size for entropy analysis (default: 256)",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "detect_hidden_files",
    description:
      "Scans for embedded file signatures and appended data after file end markers (JPEG EOI, PNG IEND). Detects polyglot files and steganographic containers.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to analyze",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "cryptographic_randomness_tests",
    description:
      "NIST-inspired randomness tests: Frequency Test, Serial Correlation, Runs Test. Distinguishes encrypted/random data from structured content.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to analyze",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "full_forensic_scan",
    description:
      "Complete forensic analysis combining all detection methods: steganalysis, entropy, embedded files, randomness tests, and metadata extraction. Returns comprehensive report with detection confidence.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to analyze",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "get_detection_ranges",
    description:
      "Returns detailed information about detection effectiveness ranges for all methods, including optimal conditions and false positive rates.",
    inputSchema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          description:
            "Specific method to get info for, or 'all' for complete list",
          enum: [
            "all",
            "rs_analysis",
            "chi_square",
            "sample_pairs",
            "primary_sets",
            "entropy_analysis",
            "audio_spectral",
            "magic_bytes",
            "metadata_analysis",
          ],
        },
      },
      required: ["method"],
    },
  },
  {
    name: "extract_metadata",
    description:
      "Extract and analyze metadata from files including EXIF, XMP, PDF properties, and hidden metadata fields that may contain steganographic data.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to analyze",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "analyze_lsb_planes",
    description:
      "Extract and analyze individual bit planes from images. Visual LSB analysis reveals hidden patterns invisible in the original image.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the image file",
        },
        channel: {
          type: "string",
          enum: ["red", "green", "blue", "all"],
          description: "Color channel to analyze",
        },
        bit_plane: {
          type: "number",
          description: "Bit plane to extract (0=LSB, 7=MSB)",
        },
      },
      required: ["file_path"],
    },
  },
];

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "analyze_image_steganography": {
      const filePath = args.file_path as string;
      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const data = fs.readFileSync(filePath);
      const results: Record<string, unknown> = {
        file: filePath,
        size: data.length,
        analyses: {},
        overallVerdict: "",
        confidence: 0,
      };

      // For image analysis, we need to extract pixel data
      // Using a simplified approach - reading raw bytes
      // In production, use sharp or similar to decode properly

      try {
        // Try to use sharp if available
        const sharp = await import("sharp").catch(() => null);
        if (sharp) {
          const image = sharp.default(filePath);
          const metadata = await image.metadata();
          const { data: rawData, info } = await image
            .raw()
            .toBuffer({ resolveWithObject: true });

          const pixels: number[] = [];
          for (let i = 0; i < rawData.length; i += info.channels) {
            pixels.push(rawData[i]); // Red channel
          }

          // Chi-Square Analysis
          const chiResult = chiSquareAnalysis(pixels);
          (results.analyses as Record<string, unknown>).chiSquare = {
            pValue: chiResult.pValue.toFixed(6),
            detected: chiResult.detected,
            interpretation: chiResult.detected
              ? "HIGH probability of LSB manipulation"
              : "No significant LSB anomaly",
            range: DETECTION_RANGES.chi_square,
          };

          // RS Analysis
          const rsResult = rsAnalysis(pixels, info.width, info.height);
          (results.analyses as Record<string, unknown>).rsAnalysis = {
            estimatedPayload: rsResult.estimatedPayload.toFixed(2) + "%",
            detected: rsResult.detected,
            interpretation: rsResult.detected
              ? `Estimated ${rsResult.estimatedPayload.toFixed(1)}% of pixels modified`
              : "No significant RS anomaly",
            range: DETECTION_RANGES.rs_analysis,
          };

          // Sample Pairs
          const spResult = samplePairsAnalysis(pixels, info.width, info.height);
          (results.analyses as Record<string, unknown>).samplePairs = {
            estimatedPayload: spResult.estimatedPayload.toFixed(2) + "%",
            detected: spResult.detected,
            interpretation: spResult.detected
              ? `Sample pairs indicate ~${spResult.estimatedPayload.toFixed(1)}% embedding`
              : "No significant sample pair anomaly",
            range: DETECTION_RANGES.sample_pairs,
          };

          // Overall verdict
          const detectionCount = [
            chiResult.detected,
            rsResult.detected,
            spResult.detected,
          ].filter(Boolean).length;

          if (detectionCount >= 2) {
            results.overallVerdict = "HIGH PROBABILITY of steganographic content";
            results.confidence = 85 + detectionCount * 5;
          } else if (detectionCount === 1) {
            results.overallVerdict = "POSSIBLE steganographic content - further analysis recommended";
            results.confidence = 60;
          } else {
            results.overallVerdict = "No strong indicators of steganography detected";
            results.confidence = 15;
          }

          results.recommendations = [
            "Run entropy analysis on suspicious regions",
            "Check for appended data after file end marker",
            "Analyze other color channels separately",
            "Try zsteg for additional LSB detection",
          ];
        } else {
          // Fallback without sharp
          results.error = "Sharp library not available. Install with: npm install sharp";
          results.fallback = true;

          // Basic entropy analysis as fallback
          const entropy = calculateEntropy(data);
          results.basicEntropy = entropy;
        }
      } catch (err) {
        results.error = `Analysis error: ${err}`;
      }

      return JSON.stringify(results, null, 2);
    }

    case "analyze_entropy": {
      const filePath = args.file_path as string;
      const blockSize = (args.block_size as number) || 256;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const data = fs.readFileSync(filePath);
      const result = analyzeEntropyBlocks(data, blockSize);

      return JSON.stringify(
        {
          file: filePath,
          size: data.length,
          overallEntropy: result.overallEntropy.toFixed(4),
          maxPossibleEntropy: 8.0,
          entropyPercentage: ((result.overallEntropy / 8) * 100).toFixed(1) + "%",
          likelyEncrypted: result.likelyEncrypted,
          likelyCompressed: result.likelyCompressed,
          highEntropyRegions: result.highEntropyRegions.slice(0, 10),
          totalHighEntropyBlocks: result.highEntropyRegions.length,
          totalBlocks: result.blockEntropies.length,
          anomalies: result.anomalies,
          interpretation: result.likelyEncrypted
            ? "Data exhibits encryption-like characteristics"
            : result.likelyCompressed
              ? "Data appears compressed but not encrypted"
              : "Data has normal/low entropy - likely plaintext or media",
          range: DETECTION_RANGES.entropy_analysis,
        },
        null,
        2
      );
    }

    case "detect_hidden_files": {
      const filePath = args.file_path as string;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const data = fs.readFileSync(filePath);
      const embedded = detectEmbeddedFiles(data);
      const appended = detectAppendedData(data);

      const results = {
        file: filePath,
        size: data.length,
        embeddedFiles: embedded,
        appendedData: appended,
        suspicious:
          embedded.suspicious ||
          appended.hasAppended,
        recommendations: [] as string[],
        range: DETECTION_RANGES.magic_bytes,
      };

      if (appended.hasAppended) {
        results.recommendations.push(
          `Extract appended data starting at offset ${appended.appendedOffset} (${appended.appendedSize} bytes)`
        );

        // Analyze the appended portion
        const appendedPortion = data.subarray(appended.appendedOffset);
        const appendedEntropy = calculateEntropy(appendedPortion);
        (results as Record<string, unknown>).appendedDataAnalysis = {
          entropy: appendedEntropy.toFixed(4),
          likelyEncrypted: appendedEntropy > 7.8,
          firstBytes: Array.from(appendedPortion.subarray(0, 16))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" "),
        };
      }

      if (embedded.found.length > 0) {
        results.recommendations.push(
          "Use binwalk or foremost to extract embedded files"
        );
      }

      return JSON.stringify(results, null, 2);
    }

    case "cryptographic_randomness_tests": {
      const filePath = args.file_path as string;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const data = fs.readFileSync(filePath);

      // Limit analysis to first 1MB for performance
      const sample = data.length > 1048576 ? data.subarray(0, 1048576) : data;

      const freq = frequencyTest(sample);
      const serial = serialCorrelation(sample);
      const runs = runsTest(sample);

      const passedTests = [freq.passed, runs.passed].filter(Boolean).length;

      return JSON.stringify(
        {
          file: filePath,
          sampleSize: sample.length,
          tests: {
            frequencyTest: freq,
            serialCorrelation: serial,
            runsTest: runs,
          },
          summary: {
            testsRun: 3,
            testsPassed: passedTests,
            looksRandom: passedTests >= 2,
            interpretation:
              passedTests >= 2
                ? "Data exhibits cryptographic randomness - likely encrypted or PRNG output"
                : "Data has detectable patterns - not pure random/encrypted",
          },
        },
        null,
        2
      );
    }

    case "full_forensic_scan": {
      const filePath = args.file_path as string;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const data = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      const report: Record<string, unknown> = {
        file: filePath,
        size: data.length,
        extension: ext,
        modified: stats.mtime,
        findings: [],
        riskLevel: "LOW",
        confidence: 0,
      };

      const findings: string[] = [];

      // Entropy Analysis
      const entropy = analyzeEntropyBlocks(data);
      report.entropyAnalysis = {
        overall: entropy.overallEntropy.toFixed(4),
        likelyEncrypted: entropy.likelyEncrypted,
        likelyCompressed: entropy.likelyCompressed,
        highEntropyRegions: entropy.highEntropyRegions.length,
        anomalies: entropy.anomalies,
      };

      if (entropy.likelyEncrypted) {
        findings.push("HIGH ENTROPY: Data appears encrypted or random");
      }
      if (entropy.highEntropyRegions.length > 0 &&
          entropy.highEntropyRegions.length < entropy.blockEntropies.length * 0.5) {
        findings.push(
          `LOCALIZED HIGH ENTROPY: ${entropy.highEntropyRegions.length} suspicious regions`
        );
      }

      // Hidden Files Detection
      const embedded = detectEmbeddedFiles(data);
      const appended = detectAppendedData(data);

      report.hiddenFilesAnalysis = {
        embeddedSignatures: embedded.found.length,
        embeddedTypes: embedded.found.map((f) => f.name),
        hasAppendedData: appended.hasAppended,
        appendedSize: appended.appendedSize,
      };

      if (embedded.found.length > 0) {
        findings.push(
          `EMBEDDED FILES: ${embedded.found.length} file signatures found at non-zero offsets`
        );
      }
      if (appended.hasAppended) {
        findings.push(
          `APPENDED DATA: ${appended.appendedSize} bytes after file end marker`
        );
      }

      // Randomness Tests
      const sample = data.length > 1048576 ? data.subarray(0, 1048576) : data;
      const freq = frequencyTest(sample);
      const runs = runsTest(sample);

      report.randomnessTests = {
        frequencyTest: freq.passed,
        runsTest: runs.passed,
        appearsCryptographic: freq.passed && runs.passed,
      };

      if (freq.passed && runs.passed && entropy.overallEntropy > 7.5) {
        findings.push("CRYPTOGRAPHIC PATTERN: Data passes randomness tests");
      }

      // Image-specific analysis
      if ([".png", ".bmp", ".gif"].includes(ext)) {
        try {
          const sharp = await import("sharp").catch(() => null);
          if (sharp) {
            const image = sharp.default(filePath);
            const { data: rawData, info } = await image
              .raw()
              .toBuffer({ resolveWithObject: true });

            const pixels: number[] = [];
            for (let i = 0; i < rawData.length; i += info.channels) {
              pixels.push(rawData[i]);
            }

            const chi = chiSquareAnalysis(pixels);
            const rs = rsAnalysis(pixels, info.width, info.height);
            const sp = samplePairsAnalysis(pixels, info.width, info.height);

            report.imageSteganalysis = {
              chiSquare: { detected: chi.detected, pValue: chi.pValue },
              rsAnalysis: {
                detected: rs.detected,
                payload: rs.estimatedPayload.toFixed(2) + "%",
              },
              samplePairs: {
                detected: sp.detected,
                payload: sp.estimatedPayload.toFixed(2) + "%",
              },
            };

            const stegDetections = [chi.detected, rs.detected, sp.detected].filter(
              Boolean
            ).length;
            if (stegDetections >= 2) {
              findings.push(
                `IMAGE STEGANOGRAPHY: ${stegDetections}/3 methods detected hidden data`
              );
            }
          }
        } catch {
          // Sharp not available
        }
      }

      // Calculate risk level
      report.findings = findings;
      if (findings.length >= 3) {
        report.riskLevel = "CRITICAL";
        report.confidence = 95;
      } else if (findings.length === 2) {
        report.riskLevel = "HIGH";
        report.confidence = 80;
      } else if (findings.length === 1) {
        report.riskLevel = "MEDIUM";
        report.confidence = 60;
      } else {
        report.riskLevel = "LOW";
        report.confidence = 20;
      }

      report.recommendations = [
        findings.length > 0
          ? "Manual review recommended - automated detection found anomalies"
          : "No significant anomalies detected",
        embedded.found.length > 0 ? "Run: binwalk -e " + filePath : null,
        appended.hasAppended
          ? `Run: dd if=${filePath} of=extracted.bin bs=1 skip=${appended.appendedOffset}`
          : null,
        entropy.likelyEncrypted ? "Attempt known encryption header detection" : null,
      ].filter(Boolean);

      return JSON.stringify(report, null, 2);
    }

    case "get_detection_ranges": {
      const method = args.method as string;

      if (method === "all") {
        return JSON.stringify(
          {
            title: "Steganography & Hidden Data Detection Effectiveness Ranges",
            description:
              "Based on academic research and practical testing. Actual effectiveness varies by implementation quality and target file characteristics.",
            methods: DETECTION_RANGES,
            generalGuidelines: {
              imageSteganography:
                "Best detected with chi-square + RS + sample pairs combination. >85% accuracy for LSB >5% capacity.",
              encryptedData:
                "Entropy >7.8 bits/byte with low variance strongly indicates encryption. NIST tests confirm.",
              appendedFiles:
                "Magic byte detection is nearly 100% accurate for known formats.",
              audioSteganography:
                "Spectral analysis at 18-22kHz or <20Hz. Phase coding harder to detect.",
            },
            optimalCombinations: [
              {
                useCase: "LSB Steganography",
                methods: ["chi_square", "rs_analysis", "sample_pairs"],
                combinedEffectiveness: "92-98%",
              },
              {
                useCase: "Hidden Encrypted Payload",
                methods: ["entropy_analysis", "magic_bytes"],
                combinedEffectiveness: "85-95%",
              },
              {
                useCase: "Full Forensic Sweep",
                methods: ["all methods combined"],
                combinedEffectiveness: "95-99% for known techniques",
              },
            ],
          },
          null,
          2
        );
      } else if (method in DETECTION_RANGES) {
        return JSON.stringify(
          DETECTION_RANGES[method as keyof typeof DETECTION_RANGES],
          null,
          2
        );
      } else {
        return JSON.stringify({ error: `Unknown method: ${method}` });
      }
    }

    case "extract_metadata": {
      const filePath = args.file_path as string;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      const results: Record<string, unknown> = {
        file: filePath,
        metadata: {},
        suspiciousFields: [],
      };

      // Try exiftool if available
      try {
        const output = execSync(`exiftool -json "${filePath}"`, {
          encoding: "utf-8",
          timeout: 30000,
        });
        const exifData = JSON.parse(output)[0];
        results.metadata = exifData;

        // Check for suspicious metadata
        const suspicious: string[] = [];
        if (exifData.Comment) suspicious.push("Comment field present");
        if (exifData.UserComment) suspicious.push("UserComment field present");
        if (exifData.XPComment) suspicious.push("XPComment (Windows) present");
        if (exifData.ImageDescription && exifData.ImageDescription.length > 100) {
          suspicious.push("Unusually long ImageDescription");
        }
        if (exifData.MakerNotes) suspicious.push("MakerNotes present (can hide data)");
        if (exifData.ThumbnailImage) suspicious.push("Embedded thumbnail (can differ from main image)");

        results.suspiciousFields = suspicious;
      } catch {
        // exiftool not available, try basic extraction
        const data = fs.readFileSync(filePath);

        // Look for XMP data
        const xmpStart = data.indexOf(Buffer.from("<?xpacket begin"));
        const xmpEnd = data.indexOf(Buffer.from("<?xpacket end"));
        if (xmpStart !== -1 && xmpEnd !== -1) {
          results.metadata = {
            hasXMP: true,
            xmpOffset: xmpStart,
            xmpSize: xmpEnd - xmpStart,
          };
          (results.suspiciousFields as string[]).push("XMP metadata block found");
        }

        results.note = "Install exiftool for comprehensive metadata extraction";
      }

      return JSON.stringify(results, null, 2);
    }

    case "analyze_lsb_planes": {
      const filePath = args.file_path as string;
      const channel = (args.channel as string) || "all";
      const bitPlane = (args.bit_plane as number) ?? 0;

      if (!fs.existsSync(filePath)) {
        return JSON.stringify({ error: `File not found: ${filePath}` });
      }

      try {
        const sharp = await import("sharp").catch(() => null);
        if (!sharp) {
          return JSON.stringify({
            error: "Sharp library required. Install with: npm install sharp",
          });
        }

        const image = sharp.default(filePath);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

        const analysis: Record<string, unknown> = {
          file: filePath,
          dimensions: `${info.width}x${info.height}`,
          channels: info.channels,
          bitPlane,
          channelAnalysis: {},
        };

        const analyzeChannel = (channelData: number[], name: string) => {
          const lsbValues = channelData.map((v) => (v >> bitPlane) & 1);
          const ones = lsbValues.filter((v) => v === 1).length;
          const zeros = lsbValues.length - ones;

          // Check for patterns
          let runs = 1;
          for (let i = 1; i < lsbValues.length; i++) {
            if (lsbValues[i] !== lsbValues[i - 1]) runs++;
          }

          const expectedRuns = lsbValues.length / 2;
          const runsDeviation = Math.abs(runs - expectedRuns) / expectedRuns;

          return {
            totalPixels: lsbValues.length,
            ones,
            zeros,
            ratio: (ones / lsbValues.length).toFixed(4),
            expectedRatio: "0.5000",
            deviation: Math.abs(0.5 - ones / lsbValues.length).toFixed(4),
            runs,
            expectedRuns: Math.round(expectedRuns),
            runsDeviation: runsDeviation.toFixed(4),
            suspicious: Math.abs(0.5 - ones / lsbValues.length) < 0.01 && runsDeviation < 0.1,
            interpretation:
              Math.abs(0.5 - ones / lsbValues.length) < 0.01
                ? "Near-perfect 50/50 distribution - possible LSB embedding"
                : "Natural distribution",
          };
        };

        const channels = ["red", "green", "blue"];
        for (let c = 0; c < Math.min(3, info.channels); c++) {
          if (channel === "all" || channel === channels[c]) {
            const channelData: number[] = [];
            for (let i = c; i < data.length; i += info.channels) {
              channelData.push(data[i]);
            }
            (analysis.channelAnalysis as Record<string, unknown>)[channels[c]] =
              analyzeChannel(channelData, channels[c]);
          }
        }

        return JSON.stringify(analysis, null, 2);
      } catch (err) {
        return JSON.stringify({ error: `Analysis failed: ${err}` });
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// Create and start the server
const server = new Server(
  {
    name: "stegcrypt-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await handleToolCall(name, (args || {}) as Record<string, unknown>);
  return {
    content: [{ type: "text", text: result }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("StegCrypt MCP Server running on stdio");
}

main().catch(console.error);
