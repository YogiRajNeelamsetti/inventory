# Production Launch Checklist

## Pre-Launch (Must-pass)

### Security
- [ ] JWT_SECRET is a unique 256-bit+ key, not the default
- [ ] Demo token endpoint is disabled (SPRING_PROFILES_ACTIVE=prod)
- [ ] H2 console is disabled in production profile
- [ ] CORS allowed origins restricted to production domain(s)
- [ ] ML service CORS (`ML_ALLOWED_ORIGINS`) restricted to production domain(s)
- [ ] All business API endpoints require valid JWT
- [ ] No `return 1L` retailer fallback in any controller

### Database
- [ ] PostgreSQL instance provisioned and accessible
- [ ] Flyway migrations run successfully against production DB
- [ ] Production profile uses `db/migration/prod` (no mock data migrations)
- [ ] Database credentials stored in secrets manager (not in code)
- [ ] Backup policy configured and tested (daily automated backups)
- [ ] Backup restore drill completed successfully

### Infrastructure
- [ ] Docker images built and pushed to registry
- [ ] SSL/TLS certificate configured for the domain
- [ ] Health checks passing: GET /actuator/health returns UP
- [ ] Internal ML process is healthy (container healthcheck validates localhost:8000)
- [ ] Resource limits (CPU/memory) set on containers
- [ ] Log aggregation configured (stdout -> centralized logging)

### Application
- [ ] Frontend VITE_API_BASE_URL points to production API
- [ ] Backend ML_SERVICE_URL points to `http://127.0.0.1:8000`
- [ ] Frontend build is optimized (npm run build, no dev warnings)
- [ ] Error states display user-friendly messages (no raw stack traces)
- [ ] Rate limiting configured at load balancer/gateway level

### Testing
- [ ] All CI pipeline checks pass (backend compile+test, frontend lint+build, Docker image builds)
- [ ] Seed data script runs without errors against fresh DB
- [ ] Auth flow verified: register -> login -> use app -> token expiry
- [ ] CRUD flows verified: items, suppliers, customers, POs, sales
- [ ] Financial integrity verified: stock deduction, payment recording
- [ ] ML integration verified: `/api/forecast/recommendations` and `/api/forecast/trends` return non-5xx responses

## Post-Launch (First 48 hours)

- [ ] Monitor error rates via actuator/metrics
- [ ] Verify health endpoint from external monitoring
- [ ] Check database connection pool metrics
- [ ] Confirm no 500 errors in application logs
- [ ] Verify backup job ran successfully

## Rollback Procedure

1. **Detect**: Health check fails or error rate > 5%
2. **Decide**: If data corruption risk, proceed to rollback
3. **Execute**:
   - Switch load balancer to previous container version
   - OR: `docker-compose down && docker-compose -f docker-compose.prev.yml up -d`
4. **Verify**: Health endpoint returns UP, test key flows
5. **Communicate**: Update status page, notify stakeholders

## Incident Response

1. **Severity 1** (service down): Target 15-min response, 1-hour resolution
2. **Severity 2** (degraded): Target 30-min response, 4-hour resolution
3. **Severity 3** (minor bug): Target 1-day response, next release fix

## SLO Targets

| Metric | Target |
|--------|--------|
| Availability | 99.5% monthly |
| API latency (p95) | < 500ms |
| Error rate | < 1% |
| Time to detect | < 5 minutes |
| Time to rollback | < 15 minutes |
