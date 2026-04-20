import ejs from 'ejs';
import path from 'path';

/**
 * In dev (`tsx` / `ts-node`) __dirname is inside `src/utils/`.
 * After `tsc` build, __dirname is inside `dist/utils/` and views are copied to `dist/views/`.
 * In both cases, going one level up from `utils` lands in the right `…/email` directory.
 */
const TEMPLATES_DIR = path.resolve(__dirname, '../views/email');

/**
 * Renders an EJS email template to an HTML string.
 *
 * @param templateName  Filename without extension, e.g. 'verify-email'
 * @param data          Variables passed into the template
 */
export async function renderEmailTemplate(
  templateName: string,
  data: Record<string, unknown> = {},
): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);

  return ejs.renderFile(templatePath, data, {
    async: true,
    // Lets <%- include('partials/_header') %> resolve relative to the templates dir
    root: TEMPLATES_DIR,
    views: [TEMPLATES_DIR],
  });
}
