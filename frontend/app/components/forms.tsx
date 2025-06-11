import { useInputControl } from "@conform-to/react";
import { useId } from "react";
import { CreatableCombobox } from "./creatable-combobox";
import { Checkbox, type CheckboxProps } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export const Field = ({
  labelsProps,
  inputProps,
  errors,
}: {
  labelsProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  errors?: string[] | undefined;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-500 text-sm" {...labelsProps}>
        {labelsProps.children}
      </label>
      <Input {...inputProps} />
      {errors ? (
        <ul role="alert" className="text-red-600 flex flex-col gap-y-0.5">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  errors?: string[] | undefined;
  className?: string;
}) {
  const fallbackId = useId();
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} className="text-gray-500 text-sm" />
      <Textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...textareaProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
}: {
  labelProps: JSX.IntrinsicElements["label"];
  buttonProps: CheckboxProps & {
    name: string;
    form: string;
    value?: string;
  };
  errors?: string[] | undefined;
  className?: string;
}) {
  const { key, defaultChecked, ...checkboxProps } = buttonProps;
  const fallbackId = useId();
  const checkedValue = buttonProps.value ?? "on";
  const input = useInputControl({
    key,
    name: buttonProps.name,
    formId: buttonProps.form,
    initialValue: defaultChecked ? checkedValue : undefined,
  });
  const id = buttonProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Checkbox
          {...checkboxProps}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          checked={input.value === checkedValue}
          onCheckedChange={(state) => {
            input.change(state.valueOf() ? checkedValue : "");
            buttonProps.onCheckedChange?.(state);
          }}
          onFocus={(event) => {
            input.focus();
            buttonProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            input.blur();
            buttonProps.onBlur?.(event);
          }}
          type="button"
        />
        <label
          htmlFor={id}
          {...labelProps}
          className="self-center text-body-xs text-muted-foreground"
        />
      </div>
      <div className="px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  );
}

export function ErrorList({
  id,
  errors,
}: {
  errors?: string[] | undefined;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="text-red-600 flex flex-col gap-y-0.5">
      {errorsToRender.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

export function CreatableComboboxField({
  labelsProps,
  value,
  onChange,
  options,
  errors,
}: {
  labelsProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  value: string;
  onChange: (values: string) => void;
  options: Array<{ id: string; name: string }>;
  errors?: string[] | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-500 text-sm" {...labelsProps}>
        {labelsProps.children}
      </label>
      <CreatableCombobox value={value} onChange={onChange} options={options} />
      {errors ? (
        <ul role="alert" className="text-red-600 flex flex-col gap-y-0.5">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
