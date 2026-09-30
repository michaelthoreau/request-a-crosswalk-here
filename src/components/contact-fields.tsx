"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { FormState } from "@/app/actions"

const toErrors = (messages?: string[]) => messages?.map((message) => ({ message }))

export function ContactFields({ state }: { state: FormState }) {
  const values = state?.values ?? {}
  const errors = state?.fieldErrors ?? {}
  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">
          Name <span className="font-normal text-muted-foreground">(anonymous is ok)</span>
        </FieldLabel>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={values.name}
          aria-invalid={!!errors.name}
        />
        <FieldError errors={toErrors(errors.name)} />
      </Field>
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values.email}
          aria-invalid={!!errors.email}
        />
        <FieldDescription>
          We&apos;ll send a link to confirm. Not shown publicly by default.
        </FieldDescription>
        <FieldError errors={toErrors(errors.email)} />
      </Field>
      <FieldSet data-invalid={!!errors.emailPreference}>
        <FieldLegend variant="label">Email preferences</FieldLegend>
        <RadioGroup
          name="emailPreference"
          required
          defaultValue={values.emailPreference}
          aria-invalid={!!errors.emailPreference}
          className="grid-cols-2"
        >
          {["no-spam", "no-spam-2"].map((value) => (
            <Field key={value} orientation="horizontal">
              <RadioGroupItem id={value} value={value} />
              <FieldLabel htmlFor={value} className="text-xs font-normal whitespace-nowrap">
                Do not send me spam
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        <FieldError errors={toErrors(errors.emailPreference)} />
      </FieldSet>
      <Field data-invalid={!!errors.address}>
        <FieldLabel htmlFor="address">
          Home address <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input
          id="address"
          name="address"
          autoComplete="street-address"
          maxLength={300}
          defaultValue={values.address}
          aria-invalid={!!errors.address}
        />
        <FieldDescription>
          Shows officials that neighbors live nearby. Not shown publicly by default.
        </FieldDescription>
        <FieldError errors={toErrors(errors.address)} />
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          id="showName"
          name="showName"
          value="yes"
          defaultChecked={values.showName === "yes"}
        />
        <FieldContent>
          <FieldLabel htmlFor="showName">Show my name publicly</FieldLabel>
          <FieldDescription>
            Your name will appear on this crosswalk&apos;s page and form letter.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
