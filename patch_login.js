const fs = require('fs');

let content = fs.readFileSync('src/app/(admin)/login/page.js', 'utf8');

content = content.replace(/if \(isMcpFlow\) \{[\s\S]*?\} else \{/m, `if (isMcpFlow) {
        const result = await signIn('credentials', {
          username: credentials.username,
          password: credentials.password,
          token: credentials.token,
          callbackUrl: '/mcp-authorize',
          redirect: true,
        });
        if (result?.error) {
          setError('Invalid credentials. Please check your username and password.');
          setIsLoading(false);
        }
      } else {`);

fs.writeFileSync('src/app/(admin)/login/page.js', content);
