import { EmailHeader } from "../email";

export interface DkimHeader {
  v: string;
  a: string;
  b: string;
  bh: string;
  c?: string;
  d: string;
  h: string;
  i?: string;
  l?: string;
  q?: string;
  s: string;
  t?: string;
  x?: string;
  z?: string;
}

export const parseDkim = (headers: EmailHeader[]): DkimHeader => {
  const dkimHeader = headers.find(
    (header) => header.key.toLowerCase() === "dkim-signature",
  );
  if (!dkimHeader) {
    throw new Error("DKIM header not found");
  }
  const dkimParams = dkimHeader.value.split(";");
  const dkim: DkimHeader = {
    v: "",
    a: "",
    b: "",
    bh: "",
    d: "",
    h: "",
    s: "",
  };
  for (let dkimParam of dkimParams) {
    dkimParam = dkimParam.trim().replace(/\r\n/g, "").replace(/\s/g, "");
    const key = dkimParam.split("=")[0];
    const value = dkimParam.slice(key.length + 1, dkimParam.length);
    dkim[key as keyof DkimHeader] = value;
  }
  return dkim;
};

export const getEmptySignatureDkim = (headers: EmailHeader[]): string => {
  const dkimHeader = headers.find(
    (header) => header.key.toLowerCase() === "dkim-signature",
  );
  if (!dkimHeader) {
    throw new Error("DKIM header not found");
  }
  const dkimParams = dkimHeader.value.split(";");
  let emptySignatureDkim = "dkim-signature:";
  for (let dkimParam of dkimParams) {
    dkimParam = dkimParam.replace(/\r\n/g, "").replace(/\s/g, "");
    const key = dkimParam.split("=")[0];
    const value =
      key === "b" ? "" : dkimParam.slice(key.length + 1, dkimParam.length);
    emptySignatureDkim += `${key}=${value}; `;
  }
  emptySignatureDkim = emptySignatureDkim.slice(0, -2);
  return emptySignatureDkim;
};
