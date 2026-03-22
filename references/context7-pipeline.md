# Context7 Pipeline

> Dung boi: write-code, plan, new-milestone, fix-bug, test
> Nguon su that cho quy trinh tra cuu thu vien ngoai

## Khi nao

BAT KY task nao su dung thu vien ngoai -> TU DONG tra cuu, KHONG can user yeu cau.

## Buoc 0: Version

Truoc khi resolve, detect version thu vien tu manifest:

| Manifest | Stack | Parse |
|----------|-------|-------|
| `package.json` | Node.js | dependencies + devDependencies -> ten:version |
| `pubspec.yaml` | Flutter | dependencies -> ten:version |
| `composer.json` | PHP | require + require-dev -> ten:version |

Nhieu manifest (monorepo) -> uu tien file gan nhat voi code dang sua.
Heuristic: `nest-cli.json` -> backend, `next.config.*` -> frontend.
Khong tim thay -> dung "latest", ghi note.

## Buoc 1: Resolve

`resolve-library-id` cho TUNG thu vien -> lay ID.
Nhieu thu vien -> resolve TAT CA truoc khi query.

## Buoc 2: Query

`query-docs` voi ID da resolve -> docs. Truyen version vao topic/query neu co.

## Fallback (Context7 loi hoac khong co ket qua)

Tu dong thu theo thu tu, KHONG hoi user:

| # | Nguon | Cach thu | Dieu kien thanh cong |
|---|-------|----------|---------------------|
| 1 | Project docs | Glob `.planning/docs/*.md` -> match ten thu vien | Tim thay file co noi dung lien quan |
| 2 | Codebase | Grep import/usage patterns trong code hien co | Tim thay patterns su dung thu vien |
| 3 | Training data | Knowledge san co cua model | Luon co (nguon cuoi) |

Fallback 3 (training data) -> hien thi: "Dung knowledge san, co the khong chinh xac cho version hien tai."

TAT CA nguon that bai -> dung training data voi warning.

## Transparency

Moi lan tra cuu, in 1 dong: `[thu vien] v[version] -- nguon: [ten nguon]`
VD: `@nestjs/common v10.3.0 -- nguon: Context7`
