type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="auth-shell stack">
      <div>
        <div className="eyebrow">Welcome back</div>
        <h1>Sign in to your Archmont account.</h1>
        <p className="subtle">
          Access upcoming visits, booking details, and provider schedules in one place.
        </p>
      </div>

      {params.error ? <div className="notice error">{params.error}</div> : null}

      <form action="/auth/login" method="post" className="stack">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="name@email.com" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Enter your password" required />
        </div>
        <button type="submit">Sign in</button>
      </form>
    </section>
  );
}
