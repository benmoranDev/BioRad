declare module 'dicom-parser' {
  export interface DicomElement {
    tag: string;
    vr?: string;
    length: number;
    dataOffset: number;
  }

  export interface DataSet {
    byteArray: Uint8Array;
    elements: Record<string, DicomElement>;
    string(tag: string, index?: number): string | undefined;
    text(tag: string, index?: number): string | undefined;
    uint16(tag: string, index?: number): number | undefined;
    int16(tag: string, index?: number): number | undefined;
    uint32(tag: string, index?: number): number | undefined;
    int32(tag: string, index?: number): number | undefined;
    float(tag: string, index?: number): number | undefined;
    double(tag: string, index?: number): number | undefined;
    numStringValues(tag: string): number;
  }

  export function parseDicom(byteArray: Uint8Array, options?: any): DataSet;

  const dicomParser: {
    parseDicom(byteArray: Uint8Array, options?: any): DataSet;
  };

  export default dicomParser;
}
