/**
 * Login page component that uses the AuthPage component from the @refinedev/antd package.
 * The AuthPage component is a wrapper around the antd Form component that provides a form for login and registration.
 * The AuthPage component also provides a way to handle form submission and validation.
 */
import { authCredentials } from "@/providers"
import { AuthPage } from "@refinedev/antd"

export const Login = () => {
  return (
    <AuthPage
      type='login'
      formProps={{
        initialValues: authCredentials,
      }}
    />
  )
}
