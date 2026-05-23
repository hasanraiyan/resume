export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

export const MUTATION_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: true,
};
