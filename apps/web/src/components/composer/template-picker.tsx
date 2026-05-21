"use client";

import { useState } from "react";
import { Button } from "@socialbd/ui";

import {
  POST_TEMPLATE_CATEGORIES,
  POST_TEMPLATE_CATEGORY_ORDER,
  getTemplatesByCategory,
  type PostTemplate,
  type PostTemplateCategory,
} from "@/lib/post-templates";

type TemplatePickerProps = {
  disabled?: boolean;
  onApply: (template: PostTemplate) => void;
};

export function TemplatePicker({ disabled, onApply }: TemplatePickerProps) {
  const [category, setCategory] = useState<PostTemplateCategory>(POST_TEMPLATE_CATEGORY_ORDER[0]);
  const meta = POST_TEMPLATE_CATEGORIES[category];
  const templates = getTemplatesByCategory(category);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div>
        <p className="text-sm font-medium">Caption templates</p>
        <p className="text-xs text-muted">
          Bangladesh-focused starters. Choose a category, then a template. Replace [brackets] or
          [বাংলা প্লেসহোল্ডার] before you publish.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PostTemplateCategory)}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {POST_TEMPLATE_CATEGORY_ORDER.map((key) => (
            <option key={key} value={key}>
              {POST_TEMPLATE_CATEGORIES[key].label}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">{meta.description}</span>
      </label>

      <ul className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <li key={template.id}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onApply(template)}
            >
              {template.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
