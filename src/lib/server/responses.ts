import { json } from '@sveltejs/kit';

export function validationError(message: string): Response {
	return json({ message }, { status: 400 });
}
