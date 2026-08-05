export type Flag = {
  opt: string;
  label: string;
};

export type Arg = {
  name: string;
  ph?: string;
  prefix?: string;
};

export type Builder = {
  cmd: string;
  /** vim の :%s/old/new/g のように区切り文字で組み立てる場合に指定 */
  sep?: string;
  flags: Flag[];
  args: Arg[];
};

export type Command = {
  id: string;
  env: string;
  cat: string;
  title: string;
  code: string;
  note: string;
  tag: string;
  kw: string;
  b?: Builder;
};

export type Group = {
  key: string;
  label: string;
  cats: string[];
};
