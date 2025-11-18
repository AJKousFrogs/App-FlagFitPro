# Pre-Migration Checklist

_Before Starting Angular 19 + PrimeNG Migration_

## ✅ Completed Tasks

- [x] **Design System Documentation** - Updated for Angular 19 + PrimeNG
- [x] **Project Inventory** - All HTML/JS/CSS files catalogued
- [x] **Migration Plan** - Comprehensive strategy created
- [x] **API Analysis** - Backend endpoints documented
- [x] **Component Mapping** - Vanilla → Angular component mapping defined

## 🔄 Critical Decisions Needed

### 1. Project Structure Decision

**Question**: Should we create a new Angular project or migrate incrementally?

**Options**:

- **A**: Create new Angular project alongside existing (Recommended)
  - Pros: Clean start, no breaking changes, can migrate incrementally
  - Cons: Two codebases temporarily
- **B**: Replace existing project entirely
  - Pros: Single codebase
  - Cons: High risk, breaks existing functionality

**Recommendation**: Option A - Create new Angular project in `angular/` directory

### 2. Backend API Strategy

**Question**: Keep Express backend or migrate to Angular Universal/SSR?

**Current State**: Express backend with Netlify Functions
**Recommendation**: Keep Express backend, create Angular HTTP services

### 3. Database Connection

**Question**: How to handle database connections in Angular?

**Current**: Direct PostgreSQL connection in Express
**Recommendation**: Keep Express backend, Angular calls Express API

### 4. Authentication Flow

**Question**: JWT storage and refresh strategy?

**Current**: JWT in localStorage
**Recommendation**:

- Store JWT in Angular service
- Use HTTP interceptor for token injection
- Implement refresh token logic

### 5. Routing Strategy

**Question**: File-based routing vs Angular Router?

**Current**: File-based (`dashboard.html`, `login.html`)
**Recommendation**: Angular Router with lazy-loaded modules

## 📋 Pre-Migration Setup Tasks

### Phase 1: Angular Project Initialization

- [ ] **Create Angular 19 project**

  ```bash
  ng new flagfit-pro-angular --routing --style=scss --standalone
  cd flagfit-pro-angular
  ```

- [ ] **Install PrimeNG**

  ```bash
  ng add primeng
  npm install primeicons @angular/animations
  ```

- [ ] **Install Additional Dependencies**

  ```bash
  npm install chart.js lucide-angular
  npm install @angular/common @angular/forms
  ```

- [ ] **Configure PrimeNG Theme**
  - [ ] Import theme CSS in `styles.scss`
  - [ ] Configure custom green theme
  - [ ] Set up theme service

- [ ] **Set up Project Structure**
  - [ ] Create `core/` directory (services, guards, interceptors)
  - [ ] Create `shared/` directory (components, directives, pipes)
  - [ ] Create `features/` directory (feature modules)
  - [ ] Create `assets/styles/` directory (SCSS files)

### Phase 2: Core Services Setup

- [ ] **Create API Service**
  - [ ] Base HTTP service
  - [ ] API endpoint constants
  - [ ] Error handling

- [ ] **Create Auth Service**
  - [ ] Login/logout methods
  - [ ] Token management
  - [ ] User state management

- [ ] **Create HTTP Interceptors**
  - [ ] Auth interceptor (add JWT token)
  - [ ] Error interceptor (handle errors)
  - [ ] Loading interceptor (show loading states)

- [ ] **Create Guards**
  - [ ] Auth guard (protect routes)
  - [ ] Role guard (role-based access)

### Phase 3: Shared Components

- [ ] **Navigation Components**
  - [ ] Sidebar component
  - [ ] Header/Top bar component
  - [ ] Mobile navigation

- [ ] **Layout Components**
  - [ ] Dashboard layout
  - [ ] Auth layout
  - [ ] Admin layout

- [ ] **UI Components**
  - [ ] Card component (wrapper around PrimeNG Card)
  - [ ] Button component (wrapper around PrimeNG Button)
  - [ ] Form components (wrappers around PrimeNG forms)

### Phase 4: Environment Configuration

- [ ] **Create Environment Files**
  - [ ] `environment.ts` (development)
  - [ ] `environment.prod.ts` (production)
  - [ ] API base URLs
  - [ ] Feature flags

- [ ] **Configure Angular.json**
  - [ ] Build configurations
  - [ ] Asset paths
  - [ ] Style preprocessor options

- [ ] **Set up Proxy Configuration**
  - [ ] Proxy for API calls during development
  - [ ] CORS configuration

## 🔍 Code Analysis Needed

### Before Migration, Review:

1. **JavaScript Dependencies**
   - [ ] List all JavaScript modules used
   - [ ] Identify which can be replaced with Angular equivalents
   - [ ] Identify which need to be converted to Angular services

2. **CSS Dependencies**
   - [ ] Audit all CSS files
   - [ ] Identify reusable styles
   - [ ] Plan SCSS conversion strategy

3. **Third-Party Libraries**
   - [ ] Chart.js → PrimeNG Charts
   - [ ] Lucide Icons → PrimeIcons + Lucide Angular
   - [ ] Date-fns → Keep or use Angular DatePipe

4. **Data Flow**
   - [ ] Map current data flow
   - [ ] Plan Angular service architecture
   - [ ] Plan state management strategy

## 🚨 Risk Assessment

### High Risk Areas

1. **Authentication Flow**
   - Risk: Breaking existing auth
   - Mitigation: Test thoroughly, keep Express backend

2. **Data Fetching**
   - Risk: API calls not working
   - Mitigation: Create comprehensive API service tests

3. **Routing**
   - Risk: Broken navigation
   - Mitigation: Map all routes carefully, test each

4. **Form Validation**
   - Risk: Validation logic lost
   - Mitigation: Document all validation rules first

### Medium Risk Areas

1. **Component State**
   - Risk: State management issues
   - Mitigation: Use Angular Signals/RxJS properly

2. **Styling**
   - Risk: Visual regressions
   - Mitigation: Side-by-side comparison, visual tests

3. **Performance**
   - Risk: Slower initial load
   - Mitigation: Lazy loading, OnPush change detection

## 📊 Migration Metrics

### Track These Metrics:

- [ ] Number of components migrated
- [ ] Number of pages migrated
- [ ] Test coverage percentage
- [ ] Performance benchmarks (before/after)
- [ ] Bundle size comparison
- [ ] Build time comparison

## 🎯 Success Criteria

Migration is successful when:

- [ ] All pages render correctly
- [ ] All forms work with validation
- [ ] Authentication flow works end-to-end
- [ ] API calls succeed
- [ ] Navigation works correctly
- [ ] Mobile responsive design maintained
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance is equal or better
- [ ] All tests pass
- [ ] Documentation updated

## 📝 Documentation Tasks

- [ ] Update README with Angular setup instructions
- [ ] Document component API (Angular version)
- [ ] Create migration guide for developers
- [ ] Update API documentation
- [ ] Create component storybook (optional)

## 🚀 Ready to Start?

**Before proceeding with HTML rewrite, ensure:**

1. ✅ Angular project is initialized
2. ✅ PrimeNG is installed and configured
3. ✅ Core services are set up
4. ✅ Shared components are created
5. ✅ Routing is configured
6. ✅ Environment is configured

**If all above are complete, proceed with HTML migration.**

---

**Next Step**: Initialize Angular project and set up core infrastructure before migrating HTML files.

**Estimated Time**: 2-3 days for setup, then 4-6 weeks for full migration
