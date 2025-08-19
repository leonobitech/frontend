// Guard estricto para setSinkId sin any.
export function hasSetSinkId(
  el: HTMLMediaElement
): el is HTMLMediaElement & Required<Pick<HTMLMediaElement, "setSinkId">> {
  return (
    (el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> })
      .setSinkId instanceof Function
  );
}
