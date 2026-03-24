# Mermaid Rules

> Nguon su that duy nhat cho mermaid-validator.js
> Doc boi: mermaid-validator.js (implement), test (validate), AI skills (generate diagrams)

## 1. Color Palette

Bang 5 mau theo Corporate Blue palette (D-01):

| Ten | Fill | Stroke | Text |
|-----|------|--------|------|
| primary | #2563EB | #1e40af | #fff |
| secondary | #64748B | #475569 | #fff |
| accent | #10B981 | #059669 | #fff |
| warning | #F59E0B | #d97706 | #000 |
| error | #DC2626 | #b91c1c | #fff |

classDef syntax cho validator va AI skills:

```
classDef primary fill:#2563EB,stroke:#1e40af,color:#fff
classDef secondary fill:#64748B,stroke:#475569,color:#fff
classDef accent fill:#10B981,stroke:#059669,color:#fff
classDef warning fill:#F59E0B,stroke:#d97706,color:#000
classDef error fill:#DC2626,stroke:#b91c1c,color:#fff
```

**Quy tac:** Chi dung 5 mau nay trong diagrams. Validator warn neu gap classDef voi fill khong nam trong palette.

## 2. Node Shapes

Bang 6 roles voi shape tuong ung (D-02 Shape-by-Role):

| Role | Shape | Syntax | VD |
|------|-------|--------|-----|
| Service | Rectangle | `A["Label"]` | `svc["Xu ly don hang"]` |
| Database | Cylinder | `A[("Label")]` | `db[("PostgreSQL")]` |
| API | Rounded | `A("Label")` | `api("REST API")` |
| Decision | Diamond | `A{"Label"}` | `dec{"Hop le?"}` |
| Start/End | Stadium | `A(["Label"])` | `start(["Bat dau"])` |
| External | Subroutine | `A[["Label"]]` | `ext[["Payment Gateway"]]` |

**Quy tac:** Chon shape phu hop voi role cua node. Validator warn neu shape khong khop voi role (neu co the xac dinh).

## 3. Label Conventions

Quy tac cho labels tren nodes va edges (D-03, D-09, D-10):

- **Node labels:** 3-5 tu, tieng Viet (per D-09)
- **Edge labels:** 1-3 tu, tieng Viet
- **LUON dung double quotes** cho tat ca labels (per D-10)
- Khong viet tat kho hieu
- Vi du: `A["Xu ly don hang"] --> B["Thanh cong"]`
- Vi du edge label: `A["Nhap lieu"] -- "hop le" --> B["Luu tru"]`

**Quy tac:** Labels phai ngan gon, ro rang, tieng Viet. KHONG dung tieng Anh trong labels tru khi la ten ky thuat (VD: "PostgreSQL", "REST API").

## 4. Max Nodes

Gioi han so luong nodes per diagram (D-04):

- Toi da **15 nodes** per diagram
- Vuot qua 15 thi tach thanh subgraphs hoac diagrams rieng
- Validator se warn khi vuot 15 nodes

**Quy tac:** Dem so luong node definitions (khong dem comments, classDef, linkStyle). Neu > 15 nodes, phai tach diagram.

## 5. Direction Rules

Bang 4 directions va khi nao dung:

| Direction | Dung khi |
|-----------|----------|
| TD (Top-Down) | Business logic flows, process flows, hierarchies — **MAC DINH** |
| LR (Left-Right) | Architecture diagrams, timelines, pipelines |
| BT (Bottom-Up) | Hiem dung — hierarchy inversion |
| RL (Right-Left) | Hiem dung — reverse flows |

**Quy tac:** Dong dau tien PHAI la `flowchart [direction]` hoac `graph [direction]`. Direction phai la mot trong: TD, TB, LR, BT, RL. Neu thieu direction declaration, validator bao syntax error.

## 6. Quoting Rules

Quy tac quoting cho labels (D-10 va Mermaid pitfalls):

- **TAT CA labels PHAI dung double quotes:** `A["Label"]`
- Khong dung single quotes
- Khong de label khong co quotes
- Label KHONG duoc chua double quotes ben trong (nested quotes)
- Tieng Viet labels BAT BUOC phai quote vi dau tieng Viet co the break parser
- Vi du dung: `A["Xu ly don hang"]`
- Vi du sai: `A[Xu ly don hang]`, `A['Xu ly don hang']`

**Quy tac:** Validator check moi label phai co double quotes bao quanh. Unquoted labels la syntax error.

## 7. Anti-Patterns

Danh sach cac loi thuong gap — validator nen check va canh bao:

1. **Unquoted labels** — break voi tieng Viet, reserved keywords. LUON quote voi double quotes.
2. **Reserved keywords lam node ID** — Cac tu sau KHONG duoc dung lam node ID khong co quotes: `end`, `graph`, `subgraph`, `click`, `call`, `default`, `style`, `classDef`, `class`, `linkStyle`, `_self`, `_blank`, `_parent`, `_top`
3. **Node ID bat dau bang 'o' hoac 'x' (don ky tu)** — Mermaid interpret la edge decorator (circle/cross). Dung node ID >= 2 ky tu.
4. **AND/OR trong labels** — Mermaid parser co the interpret la logical operators. Dung "va"/"hoac" (tieng Viet) thay the.
5. **HTML tags `<...>` trong labels** — Bi interpret la HTML. Khong dung angle brackets trong labels.
6. **Unclosed quotes** — Phai balanced per line. Moi dong phai co so luong double quotes chan.
7. **Thieu direction declaration o dong dau** — Dong dau tien phai la `flowchart [direction]` hoac `graph [direction]`.
8. **Vuot 15 nodes khong tach subgraph** — Diagram qua phuc tap, kho doc. Tach thanh subgraphs hoac diagrams rieng.

## 8. Arrow Types

Bang arrow syntax va y nghia:

| Arrow | Syntax | Meaning |
|-------|--------|---------|
| Solid | `-->` | Normal flow |
| Solid with text | `-->\|text\|` hoac `-- text -->` | Labeled flow |
| Dotted | `-.->` | Optional/async |
| Thick | `==>` | Critical path |

**Quy tac:** Dung arrow phu hop voi loai connection:
- `-->` cho luan flow chinh
- `-.->` cho optional hoac async paths
- `==>` cho critical paths can nhan manh
- Edge labels dung tieng Viet, 1-3 tu

---

*File nay la nguon su that duy nhat cho Mermaid diagrams trong du an.*
*Moi thay doi o day phai duoc phan anh trong mermaid-validator.js va tests.*
