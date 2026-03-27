import * as React from 'react';

export type PropsWithOnClose<Props = {}> = Props & {
  onClose: () => void;
};

interface DialogConfig<Props extends object = object> {
  dialog: React.ComponentType<Props>;
  dialogProps: Props;
  onClose: (...args: unknown[]) => void;
}

type CreateDialog = <Props extends object>(
  dialog: React.ComponentType<PropsWithOnClose<Props>>,
  props: Props,
  onClose?: null | ((...args: unknown[]) => void),
  config?: {replace: boolean},
) => void;

const DialogContext = React.createContext<CreateDialog>(undefined!);

export function DialogProvider({
  children,
}: Readonly<{children: React.ReactNode}>) {
  const [dialogConfigs, setDialogConfigs] = React.useState<
    Array<DialogConfig<object>>
  >([]);
  const dialogConfigsRef = React.useRef(dialogConfigs);
  const isMountedRef = React.useRef(false);

  React.useEffect(() => {
    dialogConfigsRef.current = dialogConfigs;
  }, [dialogConfigs]);

  React.useLayoutEffect(() => {
    isMountedRef.current = true;
  }, []);

  function pushDialogConfig<Props extends object>(
    dialog: React.ComponentType<PropsWithOnClose<Props>>,
    props: Props,
    onClose?: null | ((...args: unknown[]) => void),
    config = {replace: false},
  ) {
    setDialogConfigs(prev => {
      const dialogConfig = {
        dialog,
        dialogProps: props,
        onClose,
      } as DialogConfig<Props>;

      return config.replace
        ? [...prev.slice(0, prev.length - 1), dialogConfig]
        : ([...prev, dialogConfig] as any);
    });
  }

  function removeDialogConfig(dialogConfig: DialogConfig<object>) {
    if (!isMountedRef.current) {
      return;
    }

    setDialogConfigs(prev => {
      const index = prev.indexOf(dialogConfig);
      return index < 0 ? prev : prev.slice(0, index);
    });

    dialogConfig.onClose?.();
  }

  return (
    <DialogContext.Provider value={pushDialogConfig}>
      {children}
      {dialogConfigs.map((dialogConfigs, index) => (
        <DialogRenderer
          key={index}
          dialogConfig={dialogConfigs}
          dialogConfigsRef={dialogConfigsRef}
          removeDialogConfig={removeDialogConfig}
        />
      ))}
    </DialogContext.Provider>
  );
}

interface DialogRendererProps<Props extends object = object> {
  dialogConfig: DialogConfig<Props>;
  dialogConfigsRef: React.RefObject<Array<DialogConfig<Props>>>;
  removeDialogConfig: (dialogConfig: DialogConfig<Props>) => void;
}

function DialogRenderer<Props extends object = object>({
  dialogConfig,
  dialogConfigsRef,
  removeDialogConfig,
}: DialogRendererProps<Props>) {
  const {dialog: Dialog, dialogProps} = dialogConfig;
  const requestRef = React.useRef<number>(null);

  React.useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  });

  function handleClose() {
    if (requestRef.current !== null) {
      window.cancelAnimationFrame(requestRef.current);
    }

    const index = dialogConfigsRef.current.indexOf(dialogConfig);
    if (index < 0) {
      console.error(
        'Attempting to close a dialog that does not exists anymore',
      );
      return;
    }

    requestRef.current = window.requestAnimationFrame(() => {
      removeDialogConfig(dialogConfig);
      requestRef.current = null;
    });
  }

  return <Dialog {...dialogProps} onClose={handleClose} />;
}

export function useDialog() {
  return React.useContext(DialogContext);
}
